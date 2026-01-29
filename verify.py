#!/usr/bin/env python3
"""
Unified Euler Contract Verifier

Verifies that deployed Euler protocol contracts match their source code.
Finds exact deployment commits and shows differences if any.

Usage:
    uv run python verify.py mainnet           # Verify single network
    uv run python verify.py --all             # Verify all production networks
    uv run python verify.py mainnet --exhaustive  # Deep commit search
    uv run python verify.py --list            # List available networks
"""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

from verifier_lib import (
    NetworkConfig,
    load_networks,
    load_contracts,
    create_fetcher,
    CommitMatchCache,
    SourceComparator,
    VerificationResult,
    get_commits_to_try,
    get_repo_path,
    get_submodule_paths,
    get_source_commit,
    get_repo_for_contract,
    EULERSWAP_V1_CONTRACTS,
    EULERSWAP_V1_TAG,
    GLOBAL_COMMITS,
)
from verifier_lib.config import get_network, list_networks, ROOT_DIR
from verifier_lib.commits import EVK_PERIPHERY_DIR, EULER_EARN_DIR, EULER_SWAP_DIR
from verifier_lib.report import generate_report, print_summary


def checkout_repo(repo_dir: Path, commit: str) -> bool:
    """Checkout a repo to a specific commit with proper submodule handling."""
    try:
        # Checkout the commit
        subprocess.run(
            ["git", "checkout", "-f", commit],
            cwd=repo_dir,
            check=True,
            capture_output=True,
            text=True,
        )
        
        # Update direct submodules only (not recursive - too slow)
        subprocess.run(
            ["git", "submodule", "update", "--init", "--force"],
            cwd=repo_dir,
            capture_output=True,
            text=True,
            timeout=60,
        )
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False


def get_recent_commits(repo_dir: Path, max_commits: int = 100) -> List[str]:
    """Get recent commits from a repository."""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{max_commits}", "--format=%H"],
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True,
        )
        return [line.strip() for line in result.stdout.strip().split("\n") if line.strip()]
    except subprocess.CalledProcessError:
        return []


def get_diff_vs_master(contract_name: str, source_commit: str, evk_commit: str, network_name: str = None) -> Optional[str]:
    """
    Get diff between source commit and master for relevant source files.
    
    For submodule contracts, generates diff in the submodule directory within evk-periphery.
    For native evk-periphery contracts, generates diff directly.
    """
    if source_commit in ("master", "main"):
        return None
    
    # EulerSwap V1 uses eulerswap-1.0 tag - don't compare to master (V2 is different)
    # But on networks where V1 is deployed from evk-periphery (like Linea), we can diff
    if source_commit == EULERSWAP_V1_TAG or (contract_name in EULERSWAP_V1_CONTRACTS and not network_name):
        return None
    
    repo_name, _, submodule_path = get_repo_for_contract(contract_name, network_name)
    
    # For standalone repos (euler-earn), diff in that repo
    if contract_name in {"eulerEarnFactory", "eulerEarnPublicAllocator"}:
        try:
            result = subprocess.run(
                ["git", "diff", f"{source_commit}...master", "--", "src/"],
                cwd=EULER_EARN_DIR,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
            return None
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return None
    
    # For evk-periphery submodule contracts, diff within the submodule
    if submodule_path:
        try:
            # Diff within the submodule directory at evk-periphery level
            result = subprocess.run(
                ["git", "diff", f"{evk_commit}...master", "--", f"{submodule_path}/src/"],
                cwd=EVK_PERIPHERY_DIR,
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
            return None
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return None
    
    # For native evk-periphery contracts
    try:
        result = subprocess.run(
            ["git", "diff", f"{source_commit}...master", "--", "src/"],
            cwd=EVK_PERIPHERY_DIR,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        return None
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return None


def verify_contract(
    contract_name: str,
    address: str,
    fetcher,
    network_name: str,
    exhaustive: bool = False,
) -> VerificationResult:
    """Verify a single contract."""
    print(f"\n  Verifying {contract_name} @ {address}", flush=True)
    
    # Get source from explorer
    source_data = fetcher.get_verified_source(address)
    if not source_data:
        return VerificationResult(
            contract_name=contract_name,
            address=address,
            verified=False,
            error="Not verified on explorer",
        )
    
    sources = source_data.get("sources", {})
    if not sources:
        return VerificationResult(
            contract_name=contract_name,
            address=address,
            verified=False,
            error="No source files",
        )
    
    # Determine repo and submodules (network-aware for special cases like Linea)
    repo_path = get_repo_path(contract_name, network_name)
    submodules = get_submodule_paths(contract_name, network_name)
    
    # Get commits to try
    commits_to_try = get_commits_to_try(contract_name, network_name)
    
    # Try each commit
    for evk_commit in commits_to_try:
        print(f"    Trying {evk_commit}...", flush=True)
        
        if not checkout_repo(repo_path, evk_commit):
            continue
        
        comparator = SourceComparator(repo_path, submodules)
        matching, total, diff_lines = comparator.compare_sources(sources)
        
        if matching == total and total > 0:
            # Resolve actual source commit (submodule commit if applicable)
            repo_name, repo_url, source_commit = get_source_commit(contract_name, evk_commit, network_name)
            
            print(f"    ✓ Verified at {source_commit or evk_commit} ({matching}/{total} files)", flush=True)
            
            # Get diff vs master for "Changes Since Deployment" section
            diff_vs_master = get_diff_vs_master(contract_name, source_commit or evk_commit, evk_commit, network_name)
            if diff_vs_master:
                print(f"    → Changes since deployment detected", flush=True)
            
            return VerificationResult(
                contract_name=contract_name,
                address=address,
                verified=True,
                source_commit=source_commit,
                evk_periphery_commit=evk_commit if repo_name != "evk-periphery" else None,
                matching_files=matching,
                total_files=total,
                diff_vs_master=diff_vs_master,
            )
    
    # Exhaustive search if enabled
    if exhaustive:
        print(f"    Searching through recent commits...", flush=True)
        recent = get_recent_commits(repo_path, 200)
        
        for evk_commit in recent:
            if evk_commit in commits_to_try:
                continue
            
            if not checkout_repo(repo_path, evk_commit):
                continue
            
            comparator = SourceComparator(repo_path, submodules)
            matching, total, diff_lines = comparator.compare_sources(sources)
            
            if matching == total and total > 0:
                # Resolve actual source commit
                repo_name, repo_url, source_commit = get_source_commit(contract_name, evk_commit, network_name)
                
                print(f"    ✓ Found at {source_commit or evk_commit} ({matching}/{total} files)", flush=True)
                
                # Get diff vs master
                diff_vs_master = get_diff_vs_master(contract_name, source_commit or evk_commit, evk_commit, network_name)
                if diff_vs_master:
                    print(f"    → Changes since deployment detected", flush=True)
                
                return VerificationResult(
                    contract_name=contract_name,
                    address=address,
                    verified=True,
                    source_commit=source_commit,
                    evk_periphery_commit=evk_commit if repo_name != "evk-periphery" else None,
                    matching_files=matching,
                    total_files=total,
                    diff_vs_master=diff_vs_master,
                )
    
    # No exact match - return best effort at master
    print(f"    No exact match, showing diff vs master", flush=True)
    checkout_repo(repo_path, "master")
    comparator = SourceComparator(repo_path, submodules)
    matching, total, diff_lines = comparator.compare_sources(sources)
    
    return VerificationResult(
        contract_name=contract_name,
        address=address,
        verified=False,
        source_commit=None,
        evk_periphery_commit=None,
        matching_files=matching,
        total_files=total,
        diff_lines=diff_lines,
    )


def verify_network(
    config: NetworkConfig,
    exhaustive: bool = False,
    use_cache: bool = True,
) -> List[VerificationResult]:
    """Verify all contracts for a network."""
    print("=" * 60, flush=True)
    print(f"{config.name} Contract Verification", flush=True)
    print(f"Chain ID: {config.chain_id}", flush=True)
    if exhaustive:
        print("Mode: EXHAUSTIVE (searching all commits)", flush=True)
    print("=" * 60, flush=True)
    
    # Load contracts
    contracts = load_contracts(config.chain_id)
    if not contracts:
        print(f"No contracts found for chain {config.chain_id}", flush=True)
        return []
    
    print(f"Found {len(contracts)} contracts to verify", flush=True)
    
    # Create fetcher
    fetcher = create_fetcher(config)
    
    # Create cache
    cache = CommitMatchCache()
    
    # Get network name for hints
    network_name = config.name.lower()
    for key in ["mainnet", "arbitrum", "base", "bsc", "avalanche", "linea",
                "gnosis", "optimism", "polygon", "swell", "bob", "unichain",
                "berachain", "sonic"]:
        if key in network_name:
            network_name = key
            break
    
    results = []
    for contract_name, address in contracts.items():
        # NOTE: Cache disabled for now - it doesn't preserve all required data
        # (source_commit, evk_periphery_commit, file counts, diffs)
        # TODO: Enhance cache to store full VerificationResult data
        
        # Verify contract
        result = verify_contract(
            contract_name,
            address,
            fetcher,
            network_name,
            exhaustive,
        )
        results.append(result)
    
    return results


def print_networks_list():
    """Print list of available networks."""
    networks = load_networks()
    
    print("\nAvailable networks:\n")
    print("Production:")
    for name, config in sorted(networks.items(), key=lambda x: x[1].chain_id):
        if config.is_production:
            print(f"  {name:15} (chain {config.chain_id})")
    
    print("\nTesting:")
    for name, config in sorted(networks.items(), key=lambda x: x[1].chain_id):
        if not config.is_production:
            print(f"  {name:15} (chain {config.chain_id})")


def main():
    parser = argparse.ArgumentParser(
        description="Unified Euler Contract Verifier",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    uv run python verify.py mainnet           # Verify Ethereum mainnet
    uv run python verify.py --all             # Verify all production networks
    uv run python verify.py unichain --exhaustive  # Deep search for Unichain
    uv run python verify.py --list            # List available networks
        """,
    )
    
    parser.add_argument(
        "network",
        nargs="?",
        help="Network name or chain ID to verify",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Verify all production networks",
    )
    parser.add_argument(
        "--exhaustive",
        action="store_true",
        help="Enable exhaustive commit search (slower but more thorough)",
    )
    parser.add_argument(
        "--skip-cache",
        action="store_true",
        help="Skip cache and re-verify all contracts",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available networks",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Output to *_test.md files for comparison",
    )
    
    args = parser.parse_args()
    
    # List networks
    if args.list:
        print_networks_list()
        return 0
    
    # Determine networks to verify
    if args.all:
        networks = list_networks(production_only=True)
        configs = list(networks.values())
    elif args.network:
        try:
            config = get_network(args.network)
            configs = [config]
        except ValueError as e:
            print(f"Error: {e}", file=sys.stderr)
            print("Use --list to see available networks", file=sys.stderr)
            return 1
    else:
        parser.print_help()
        return 1
    
    # Verify each network
    all_results = {}
    for config in configs:
        results = verify_network(
            config,
            exhaustive=args.exhaustive,
            use_cache=not args.skip_cache,
        )
        
        if results:
            # Generate report
            suffix = "_test" if args.test else ""
            report_path = generate_report(config, results, suffix=suffix)
            print(f"\nReport: {report_path}", flush=True)
            
            # Print summary
            print_summary(config, results)
            
            all_results[config.name] = results
    
    # Final summary for --all
    if args.all and len(all_results) > 1:
        print("\n" + "=" * 60)
        print("OVERALL SUMMARY")
        print("=" * 60)
        
        total_verified = 0
        total_contracts = 0
        
        for network_name, results in all_results.items():
            verified = sum(1 for r in results if r.verified)
            total = len(results)
            total_verified += verified
            total_contracts += total
            
            status = "✅" if verified == total else "⚠️"
            print(f"  {status} {network_name}: {verified}/{total}")
        
        print(f"\nTotal: {total_verified}/{total_contracts} contracts verified")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
