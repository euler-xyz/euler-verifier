#!/usr/bin/env python3
"""
Berachain (Chain 80094) Contract Verification

Verifies Euler contracts by:
1. Finding the exact deployment commit (exhaustive search)
2. Verifying source matches at that commit
3. Showing diff between deployment commit and master
"""

import json
import os
import sys
import subprocess
import requests
import argparse
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, field
from difflib import unified_diff

# Global flag for exhaustive search
EXHAUSTIVE_SEARCH = False

# =============================================================================
# CONFIGURATION
# =============================================================================

CHAIN_ID = 80094
NETWORK_NAME = "Berachain"
EXPLORER_URL = "https://berascan.com"
EXPLORER_API = "https://api.etherscan.io/v2/api"  # Etherscan V2 unified API
API_TYPE = "etherscan_v2"  # blockscout_v2 or etherscan or etherscan_v2

# Paths
ROOT_DIR = Path(__file__).parent
EVK_PERIPHERY_DIR = ROOT_DIR / "repos" / "evk-periphery"
EULER_EARN_DIR = ROOT_DIR / "repos" / "euler-earn-standalone"
EULER_SWAP_DIR = ROOT_DIR / "repos" / "euler-swap-standalone"
RESULTS_DIR = ROOT_DIR / "results"
CACHE_DIR = ROOT_DIR / "cache" / "blockscout"
COMMIT_CACHE_FILE = ROOT_DIR / "cache" / "deployment_commits.json"

# GitHub URLs
EVK_PERIPHERY_URL = "https://github.com/euler-xyz/evk-periphery"
EULER_EARN_URL = "https://github.com/euler-xyz/euler-earn"
EULER_SWAP_URL = "https://github.com/euler-xyz/euler-swap"

# =============================================================================
# FOCUSED CONTRACT LIST (from euler-interfaces)
# =============================================================================

FOCUSED_CONTRACTS = {
    # Core contracts
    "evc": "0x45334608ECE7B2775136bC847EB92B5D332806A9",
    "eVaultFactory": "0x5C13fb43ae9BAe8470f646ea647784534E9543AF",
    "eVaultImplementation": "0x402598Ac4034D24f2cB37BDb0721A67365aD19BD",
    "protocolConfig": "0x51432af61A715DB3D0f20A3691C1E25F9A2c6B05",
    "sequenceRegistry": "0x0c9a75E05764775A0cF52bC6cbfE6Cb229bb3901",
    "balanceTracker": "0x70Fb24bDa46E7cFD447C64bB32180Bc746ba3A71",
    
    # Euler Earn
    "eulerEarnFactory": "0x9cbc3030e6d133D1AAa148D598FD82D70263495c",
    
    # EulerSwap V1
    "eulerSwapV1Factory": "0xD14c95dc228E8851F63d9b83A0001F4D021B5DFf",
    "eulerSwapV1Implementation": "0x0e05d236cb6c350935751A73e834A13111998e3c",
    "eulerSwapV1Periphery": "0x46F951278f52f4798542C51BfB8Df1c165199150",
    
    # EulerSwap V2
    "eulerSwapV2Factory": "0x1A4546b988Ee133F72b7E27a4890355b0a341554",
    "eulerSwapV2Implementation": "0x9253a3EF2cE8875b7D15Bd2bcd3a405b62a7b0E7",
    "eulerSwapV2Periphery": "0x5e044DB2Fd14fbB48334b239CfD8530C9b03150B",
    "eulerSwapV2ProtocolFeeConfig": "0xAe26ca82da91a1157E3cC0B36a9A06f539f4DF24",
    "eulerSwapV2Registry": "0x8D8B81F0c1be01fa3636d2cD6DeF07474d75e1e9",
    
    # IRM Factories
    "adaptiveCurveIRMFactory": "0xc6e28b94737f664b0be4230bd86793B6B6ed973B",
    "fixedCyclicalBinaryIRMFactory": "0x664a67B5D4e53B8A0eab1421EEe2b7097a5523d1",
    "kinkIRMFactory": "0xeAF2a39A6D1A4C9b00Aca48eCE42C044A5a9628a",
    "kinkyIRMFactory": "0xE43Aa2a0bee4dd4C88148e1C459ee0323d4CAf22",
    
    # Periphery
    "eulerEarnPublicAllocator": "0x4E7C059099496D56e8662570426991EA63C63C85",
    "feeFlowController": "0x5EAe58dc72E4E374F32eCA2751cC38b573dd82c9",
    "governorAccessControlEmergencyFactory": "0x3e3eD6B48B7fBD2518019CE53bbB02048E56f265",
    "oracleRouterFactory": "0x809aB347e6ECb46714917A7796E542c86f75FbF1",
    "swapVerifier": "0x6fFf8Ac4AB123B62FF5e92aBb9fF702DCBD6C939",
    "termsOfUseSigner": "0x295B1A5DBC76d8755e078Fe9b4D49F251321c4F2",
}

# Known deployment commits (hints for faster search)
DEPLOYMENT_HINTS = {
    "evc": "2b087370",
    "eVaultFactory": "2b087370",
    "eVaultImplementation": "2b087370",
    "protocolConfig": "2b087370",
    "sequenceRegistry": "2b087370",
    "balanceTracker": "deploy-swell",
    "feeFlowController": "2b087370",
    "kinkIRMFactory": "2b087370",
    "swapVerifier": "2b087370",
}

# Contracts from standalone repos (not evk-periphery)
STANDALONE_CONTRACTS = {
    "eulerEarnFactory": ("euler-earn", EULER_EARN_DIR),
    "eulerEarnPublicAllocator": ("euler-earn", EULER_EARN_DIR),
    "eulerSwapV1Factory": ("euler-swap-v1", EULER_SWAP_DIR),
    "eulerSwapV1Implementation": ("euler-swap-v1", EULER_SWAP_DIR),
    "eulerSwapV1Periphery": ("euler-swap-v1", EULER_SWAP_DIR),
}

# EulerSwap V1 contracts should use eulerswap-1.0 tag (their "master")
EULERSWAP_V1_CONTRACTS = {"eulerSwapV1Factory", "eulerSwapV1Implementation", "eulerSwapV1Periphery"}

# =============================================================================
# SOURCE REPOSITORY MAPPING
# =============================================================================

SOURCE_REPOS = {
    "evc": ("ethereum-vault-connector", "https://github.com/euler-xyz/ethereum-vault-connector", "lib/ethereum-vault-connector"),
    "eVaultFactory": ("euler-vault-kit", "https://github.com/euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "eVaultImplementation": ("euler-vault-kit", "https://github.com/euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "protocolConfig": ("euler-vault-kit", "https://github.com/euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "sequenceRegistry": ("euler-vault-kit", "https://github.com/euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "balanceTracker": ("reward-streams", "https://github.com/euler-xyz/reward-streams", "lib/reward-streams"),
    "feeFlowController": ("fee-flow", "https://github.com/euler-xyz/fee-flow", "lib/fee-flow"),
    "eulerEarnFactory": ("euler-earn", "https://github.com/euler-xyz/euler-earn", "lib/euler-earn"),
    "eulerEarnPublicAllocator": ("euler-earn", "https://github.com/euler-xyz/euler-earn", "lib/euler-earn"),
    "eulerSwapV1Factory": ("euler-swap", "https://github.com/euler-xyz/euler-swap", None),
    "eulerSwapV1Implementation": ("euler-swap", "https://github.com/euler-xyz/euler-swap", None),
    "eulerSwapV1Periphery": ("euler-swap", "https://github.com/euler-xyz/euler-swap", None),
    "eulerSwapV2Factory": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Implementation": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Periphery": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2ProtocolFeeConfig": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Registry": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "adaptiveCurveIRMFactory": ("evk-periphery", EVK_PERIPHERY_URL, None),
    "fixedCyclicalBinaryIRMFactory": ("evk-periphery", EVK_PERIPHERY_URL, None),
    "kinkIRMFactory": ("evk-periphery", EVK_PERIPHERY_URL, None),
    "kinkyIRMFactory": ("evk-periphery", EVK_PERIPHERY_URL, None),
    "governorAccessControlEmergencyFactory": ("evk-periphery", EVK_PERIPHERY_URL, None),
    "oracleRouterFactory": ("evk-periphery", EVK_PERIPHERY_URL, None),
    "swapVerifier": ("evk-periphery", EVK_PERIPHERY_URL, None),
    "termsOfUseSigner": ("evk-periphery", EVK_PERIPHERY_URL, None),
}

# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class VerificationResult:
    contract_name: str
    address: str
    verified: bool
    matching_files: int = 0
    total_files: int = 0
    found_commit: Optional[str] = None
    diff_lines: List[str] = field(default_factory=list)
    source_repo_name: Optional[str] = None
    source_repo_url: Optional[str] = None
    source_commit: Optional[str] = None
    evk_periphery_commit: Optional[str] = None
    diff_to_master: Optional[str] = None
    error: Optional[str] = None

# =============================================================================
# GIT OPERATIONS
# =============================================================================

def run_git(args: List[str], cwd: Path) -> Tuple[bool, str]:
    try:
        result = subprocess.run(
            ["git"] + args,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode == 0, result.stdout.strip()
    except Exception as e:
        return False, str(e)

def checkout_repo(repo_path: Path, commit: str) -> bool:
    success, _ = run_git(["fetch", "--all", "--tags"], repo_path)
    success, _ = run_git(["checkout", commit, "--force"], repo_path)
    if not success:
        return False
    
    # Try to update submodules
    success, _ = run_git(["submodule", "update", "--init", "--recursive"], repo_path)
    if not success:
        # Fallback: manually checkout submodules
        gitmodules = repo_path / ".gitmodules"
        if gitmodules.exists():
            import configparser
            config = configparser.ConfigParser()
            config.read(gitmodules)
            for section in config.sections():
                if section.startswith("submodule"):
                    path = config.get(section, "path", fallback=None)
                    url = config.get(section, "url", fallback=None)
                    if path and url:
                        submod_path = repo_path / path
                        if not submod_path.exists():
                            run_git(["clone", url, str(submod_path)], repo_path)
                        # Get pinned commit
                        success, pinned = run_git(["ls-tree", "HEAD", path], repo_path)
                        if success and pinned:
                            parts = pinned.split()
                            if len(parts) >= 3:
                                pinned_commit = parts[2]
                                run_git(["fetch", "--all"], submod_path)
                                run_git(["checkout", pinned_commit, "--force"], submod_path)
    return True

def get_recent_commits(repo_path: Path, n: int = 200) -> List[str]:
    success, output = run_git(["log", "--all", "--oneline", "-n", str(n)], repo_path)
    if not success:
        return []
    return [line.split()[0] for line in output.split("\n") if line]

def get_submodule_commit(repo_path: Path, submodule_path: str) -> Optional[str]:
    success, output = run_git(["ls-tree", "HEAD", submodule_path], repo_path)
    if success and output:
        parts = output.split()
        if len(parts) >= 3:
            return parts[2][:8]
    return None

# =============================================================================
# ETHERSCAN-COMPATIBLE API
# =============================================================================

class EtherscanFetcher:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ETHERSCAN_API_KEY", "")
        self.cache_dir = CACHE_DIR / str(CHAIN_ID)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get_verified_source(self, address: str) -> Optional[Dict[str, Any]]:
        cache_file = self.cache_dir / f"{address.lower()}.json"
        
        if cache_file.exists():
            with open(cache_file) as f:
                return json.load(f)
        
        print(f"    Fetching from {NETWORK_NAME} explorer...", flush=True)
        url = f"{EXPLORER_API}?chainid={CHAIN_ID}&module=contract&action=getsourcecode&address={address}&apikey={self.api_key}"
        
        try:
            response = requests.get(url, timeout=30)
            data = response.json()
            
            if data.get("status") != "1":
                return None
            
            result = data["result"][0]
            if not result.get("SourceCode"):
                return None
            
            source_code = result["SourceCode"]
            if source_code.startswith("{{"):
                source_code = source_code[1:-1]
                parsed = json.loads(source_code)
            elif source_code.startswith("{"):
                try:
                    parsed = json.loads(source_code)
                except:
                    parsed = {"sources": {result["ContractName"]: {"content": source_code}}}
            else:
                parsed = {"sources": {result["ContractName"]: {"content": source_code}}}
            
            source_data = {
                "address": address,
                "contractName": result["ContractName"],
                "compilerVersion": result["CompilerVersion"],
                "runs": int(result.get("Runs", 200)),
                "sources": parsed.get("sources", {}),
            }
            
            with open(cache_file, "w") as f:
                json.dump(source_data, f, indent=2)
            
            return source_data
        except Exception as e:
            print(f"    Error: {e}", flush=True)
            return None

# =============================================================================
# SOURCE COMPARISON
# =============================================================================

class SourceComparator:
    def __init__(self, repo_path: Path, submodule_paths: Optional[List[str]] = None):
        self.repo_path = repo_path
        self.submodule_paths = submodule_paths or []
    
    def find_local_file(self, explorer_path: str) -> Optional[Path]:
        local_path = self.repo_path / explorer_path
        if local_path.exists():
            return local_path
        
        for submod_path in self.submodule_paths:
            local_path = self.repo_path / submod_path / explorer_path
            if local_path.exists():
                return local_path
        
        parts = explorer_path.split("/")
        for i in range(len(parts)):
            subpath = "/".join(parts[i:])
            local_path = self.repo_path / subpath
            if local_path.exists():
                return local_path
            for submod_path in self.submodule_paths:
                local_path = self.repo_path / submod_path / subpath
                if local_path.exists():
                    return local_path
        
        return None
    
    def normalize_source(self, content: str) -> str:
        import re
        normalized = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', 'EMAIL', content)
        normalized = normalized.replace('\r\n', '\n')
        
        # Normalize import paths
        normalized = re.sub(r'lib/ethereum-vault-connector/src/', '', normalized)
        normalized = re.sub(r'lib/euler-vault-kit/src/', '', normalized)
        normalized = re.sub(r'lib/reward-streams/src/', '', normalized)
        normalized = re.sub(r'lib/fee-flow/src/', '', normalized)
        normalized = re.sub(r'lib/euler-earn/src/', '', normalized)
        normalized = re.sub(r'lib/euler-swap/src/', '', normalized)
        
        lines = normalized.split('\n')
        lines = [line.rstrip() for line in lines]
        while lines and not lines[-1]:
            lines.pop()
        
        return '\n'.join(lines)
    
    def compare_sources(self, explorer_sources: Dict[str, Any]) -> Tuple[int, int, List[str]]:
        matching = 0
        total = 0
        diff_lines = []
        
        for filepath, source_info in explorer_sources.items():
            if not filepath.endswith('.sol'):
                continue
            
            total += 1
            explorer_content = source_info.get("content", "")
            local_file = self.find_local_file(filepath)
            
            if not local_file:
                diff_lines.append(f"--- {filepath}: NOT FOUND locally")
                continue
            
            try:
                local_content = local_file.read_text()
            except:
                diff_lines.append(f"--- {filepath}: Could not read")
                continue
            
            norm_explorer = self.normalize_source(explorer_content)
            norm_local = self.normalize_source(local_content)
            
            if norm_explorer == norm_local:
                matching += 1
            else:
                diff = list(unified_diff(
                    norm_local.split('\n'),
                    norm_explorer.split('\n'),
                    fromfile=f"local/{filepath}",
                    tofile=f"explorer/{filepath}",
                    lineterm=""
                ))
                if diff:
                    diff_lines.extend(diff[:50])
        
        return matching, total, diff_lines

# =============================================================================
# VERIFICATION LOGIC
# =============================================================================

def verify_at_commit(contract_name: str, address: str, fetcher: BlockscoutFetcher, 
                     repo_path: Path, commit: str, submodules: List[str]) -> Tuple[bool, int, int, List[str]]:
    if not checkout_repo(repo_path, commit):
        return False, 0, 0, [f"Failed to checkout {commit}"]
    
    comparator = SourceComparator(repo_path, submodules)
    source_data = fetcher.get_verified_source(address)
    
    if not source_data:
        return False, 0, 0, ["Not verified on explorer"]
    
    matching, total, diff_lines = comparator.compare_sources(source_data.get("sources", {}))
    
    return matching == total and total > 0, matching, total, diff_lines

def hunt_for_commit(contract_name: str, address: str, fetcher: EtherscanFetcher,
                    repo_path: Path, submodules: List[str]) -> Tuple[Optional[str], int, int, List[str]]:
    # For EulerSwap V1, eulerswap-1.0 is the "master" - try it first
    if contract_name in EULERSWAP_V1_CONTRACTS:
        known_commits = ["eulerswap-1.0", "master", "main"]
    else:
        known_commits = [
            "master", "main",
            "2b087370", "5e066711", "392c7bd0", "6fee729e", "a11037fa", "f61809fd",
            "dec63c2a", "4edac34f", "deploy-swell", "773453b",
        ]
    
    # Try hint first
    hint = DEPLOYMENT_HINTS.get(contract_name)
    if hint and hint not in known_commits:
        known_commits.insert(0, hint)
    
    for commit in known_commits:
        print(f"    Trying {commit}...", flush=True)
        success, matching, total, diff_lines = verify_at_commit(
            contract_name, address, fetcher, repo_path, commit, submodules
        )
        if success:
            return commit, matching, total, diff_lines
    
    # Exhaustive search only if flag is set
    if EXHAUSTIVE_SEARCH:
        print(f"    Searching through recent commits...", flush=True)
        recent = get_recent_commits(repo_path, 200)
        for commit in recent:
            if commit in known_commits:
                continue
            success, matching, total, diff_lines = verify_at_commit(
                contract_name, address, fetcher, repo_path, commit, submodules
            )
            if success:
                return commit, matching, total, diff_lines
    
    # Return best effort from master
    print(f"    No exact match, showing diff vs master", flush=True)
    checkout_repo(repo_path, "master")
    comparator = SourceComparator(repo_path, submodules)
    source_data = fetcher.get_verified_source(address)
    if source_data:
        matching, total, diff_lines = comparator.compare_sources(source_data.get("sources", {}))
        return None, matching, total, diff_lines
    
    return None, 0, 0, ["Could not verify"]

def verify_contract(contract_name: str, address: str, fetcher: EtherscanFetcher) -> VerificationResult:
    print(f"\n  Verifying {contract_name} @ {address}", flush=True)
    
    # Determine repo and submodules
    if contract_name in STANDALONE_CONTRACTS:
        repo_type, repo_path = STANDALONE_CONTRACTS[contract_name]
        if repo_type == "euler-swap-v1":
            submodules = []
            checkout_repo(repo_path, "eulerswap-1.0")
        else:
            submodules = []
            checkout_repo(repo_path, "origin/deployment-script")
    else:
        repo_path = EVK_PERIPHERY_DIR
        submodules = [
            "lib/ethereum-vault-connector",
            "lib/euler-vault-kit", 
            "lib/reward-streams",
            "lib/fee-flow",
            "lib/euler-earn",
            "lib/euler-swap",
            "lib/euler-price-oracle",
        ]
    
    # Hunt for matching commit
    found_commit, matching, total, diff_lines = hunt_for_commit(
        contract_name, address, fetcher, repo_path, submodules
    )
    
    # Get source repo info
    source_info = SOURCE_REPOS.get(contract_name, ("evk-periphery", EVK_PERIPHERY_URL, None))
    source_repo_name, source_repo_url, submod_path = source_info
    
    source_commit = None
    if found_commit and submod_path and repo_path == EVK_PERIPHERY_DIR:
        checkout_repo(repo_path, found_commit)
        source_commit = get_submodule_commit(repo_path, submod_path)
    elif found_commit:
        source_commit = found_commit[:8] if len(found_commit) > 8 else found_commit
    
    result = VerificationResult(
        contract_name=contract_name,
        address=address,
        verified=found_commit is not None,
        matching_files=matching,
        total_files=total,
        found_commit=found_commit,
        diff_lines=diff_lines,
        source_repo_name=source_repo_name,
        source_repo_url=source_repo_url,
        source_commit=source_commit,
        evk_periphery_commit=found_commit if repo_path == EVK_PERIPHERY_DIR else None,
    )
    
    if found_commit:
        print(f"    ✓ Verified at {found_commit} ({matching}/{total} files)", flush=True)
    else:
        print(f"    ✗ No exact match ({matching}/{total} files)", flush=True)
    
    return result

# =============================================================================
# REPORT GENERATION
# =============================================================================

def generate_report(results: List[VerificationResult]) -> str:
    verified = sum(1 for r in results if r.verified)
    total = len(results)
    
    lines = [
        f"# {NETWORK_NAME} Contract Verification Report",
        "",
        f"**Chain ID:** {CHAIN_ID}",
        f"**Explorer:** [{EXPLORER_URL}]({EXPLORER_URL})",
        f"**Status:** {'✅' if verified == total else '⚠️'} {verified}/{total} contracts verified",
        "",
        "## Summary",
        "",
        "| Contract | Address | Status | Source Repo | Commit |",
        "|----------|---------|--------|-------------|--------|",
    ]
    
    for r in results:
        addr_link = f"[{r.address[:10]}...]({EXPLORER_URL}/address/{r.address})"
        status = "✅" if r.verified else "❌"
        
        if r.source_repo_url and r.source_commit:
            repo_link = f"[{r.source_repo_name}]({r.source_repo_url})"
            commit_link = f"[{r.source_commit}]({r.source_repo_url}/tree/{r.source_commit})"
        else:
            repo_link = r.source_repo_name or "-"
            commit_link = r.found_commit or "-"
        
        lines.append(f"| {r.contract_name} | {addr_link} | {status} | {repo_link} | {commit_link} |")
    
    # Add diffs for unverified contracts
    unverified = [r for r in results if not r.verified and r.diff_lines]
    if unverified:
        lines.extend(["", "## Contracts With Differences", ""])
        for r in unverified:
            lines.append(f"### {r.contract_name}")
            lines.append("")
            lines.append("```diff")
            lines.extend(r.diff_lines[:100])
            if len(r.diff_lines) > 100:
                lines.append(f"... ({len(r.diff_lines) - 100} more lines)")
            lines.append("```")
            lines.append("")
    
    return "\n".join(lines)

# =============================================================================
# MAIN
# =============================================================================

def main():
    global EXHAUSTIVE_SEARCH
    
    parser = argparse.ArgumentParser(description=f'{NETWORK_NAME} Contract Verification')
    parser.add_argument('--exhaustive', action='store_true', 
                        help='Enable exhaustive commit search (slower but more thorough)')
    args = parser.parse_args()
    
    EXHAUSTIVE_SEARCH = args.exhaustive
    
    print(f"=" * 60, flush=True)
    print(f"{NETWORK_NAME} Contract Verification", flush=True)
    if EXHAUSTIVE_SEARCH:
        print(f"Mode: EXHAUSTIVE (searching all commits)", flush=True)
    print(f"=" * 60, flush=True)
    
    fetcher = EtherscanFetcher()
    results = []
    
    for contract_name, address in FOCUSED_CONTRACTS.items():
        if address == "0x0000000000000000000000000000000000000000":
            continue
        result = verify_contract(contract_name, address, fetcher)
        results.append(result)
    
    # Generate report
    report = generate_report(results)
    report_file = RESULTS_DIR / f"{NETWORK_NAME.lower()}.md"
    report_file.write_text(report)
    
    # Summary
    verified = sum(1 for r in results if r.verified)
    total = len(results)
    print(f"\n{'=' * 60}", flush=True)
    print(f"Results: {verified}/{total} contracts verified", flush=True)
    print(f"Report: {report_file}", flush=True)
    
    return 0 if verified == total else 1

if __name__ == "__main__":
    sys.exit(main())
