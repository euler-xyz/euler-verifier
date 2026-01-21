#!/usr/bin/env python3
"""
Multi-Network Contract Verification Tool

Verifies Euler protocol contracts across multiple networks using Etherscan V2 API.
"""

import json
import os
import sys
import subprocess
import requests
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from difflib import unified_diff

# Paths
ROOT_DIR = Path(__file__).parent
EVK_PERIPHERY_DIR = ROOT_DIR / "repos" / "evk-periphery"
EULER_EARN_DIR = ROOT_DIR / "repos" / "euler-earn-standalone"
EULER_SWAP_DIR = ROOT_DIR / "repos" / "euler-swap-standalone"
RESULTS_DIR = ROOT_DIR / "results"
CACHE_DIR = ROOT_DIR / "cache" / "etherscan"
EULER_INTERFACES_DIR = ROOT_DIR / "euler-interfaces"

# Etherscan V2 unified API endpoint
ETHERSCAN_V2_API = "https://api.etherscan.io/v2/api"

# Networks with Etherscan V2 API support
# Format: chain_id -> (name, explorer_url)
ETHERSCAN_NETWORKS = {
    1: ("ethereum", "https://etherscan.io"),
    42161: ("arbitrum", "https://arbiscan.io"),
    8453: ("base", "https://basescan.org"),
    56: ("bsc", "https://bscscan.com"),
    43114: ("avalanche", "https://snowscan.xyz"),
    10: ("optimism", "https://optimistic.etherscan.io"),
    137: ("polygon", "https://polygonscan.com"),
    59144: ("linea", "https://lineascan.build"),
    100: ("gnosis", "https://gnosisscan.io"),
}

# Networks with Blockscout API support
# Format: chain_id -> (name, api_url, explorer_url)
BLOCKSCOUT_NETWORKS = {
    1923: ("swell", "https://explorer.swellnetwork.io/api", "https://explorer.swellnetwork.io"),
    146: ("sonic", "https://sonicscan.org/api", "https://sonicscan.org"),
    60808: ("bob", "https://explorer.gobob.xyz/api", "https://explorer.gobob.xyz"),
    80094: ("berachain", "https://api.berascan.io/api", "https://berascan.com"),
    130: ("unichain", "https://unichain.blockscout.com/api", "https://unichain.blockscout.com"),
    239: ("tac", "https://tac.build/api", "https://tac.build"),
}

# Deployment commits for evk-periphery (same as mainnet for most networks)
CORE_DEPLOYMENT_COMMIT = "2b087370"
LENS_V1_DEPLOYMENT_COMMIT = "392c7bd0"
IRM_LENS_DEPLOYMENT_COMMIT = "6fee729e"
LENS_V2_DEPLOYMENT_COMMIT = "master"
PERIPHERY_V1_DEPLOYMENT_COMMIT = "5e066711"
TERMS_OF_USE_DEPLOYMENT_COMMIT = "a11037fa"
NEWER_DEPLOYMENT_COMMIT = "master"

# Known deployment commits to try (most recent first)
COMMITS_TO_TRY = [
    "master",           # Latest
    "a11037fa",         # TermsOfUseSigner visibility fix
    "6fee729e",         # Pre-Sepolia (irmLens)
    "392c7bd0",         # Lens V1 (pre-Plasma)
    "5e066711",         # Periphery V1 (older EVC)
    "2b087370",         # Core contracts deployment
    # Additional older commits for networks deployed earlier
    "4cc0478d",         # Older core
    "7821a70e",         # Swapper deployment
    "d8b2e1a0",         # Even older
]

# Cache for successful commit matches per contract
COMMIT_CACHE_FILE = ROOT_DIR / "cache" / "commit_matches.json"


def load_commit_cache() -> Dict[str, str]:
    """Load cached commit matches"""
    if COMMIT_CACHE_FILE.exists():
        try:
            with open(COMMIT_CACHE_FILE) as f:
                return json.load(f)
        except:
            pass
    return {}


def save_commit_cache(cache: Dict[str, str]):
    """Save commit cache"""
    COMMIT_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(COMMIT_CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


def get_recent_commits(limit: int = 50) -> List[str]:
    """Get recent commits from evk-periphery"""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{limit}", "--format=%h"],
            cwd=EVK_PERIPHERY_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip().split("\n")
    except:
        return COMMITS_TO_TRY


@dataclass
class VerificationResult:
    """Result of verifying a single contract"""
    contract_name: str
    address: str
    etherscan_name: str
    status: str  # "exact_match", "diff_found", "error", "not_verified"
    diff: str
    files_checked: int
    files_matched: int
    error_message: Optional[str] = None


def load_chain_addresses(chain_id: int) -> Dict[str, Dict[str, str]]:
    """Load all addresses for a chain from euler-interfaces"""
    addresses_dir = EULER_INTERFACES_DIR / "addresses" / str(chain_id)
    
    if not addresses_dir.exists():
        return {}
    
    all_addresses = {}
    
    # Load each address file
    for addr_file in addresses_dir.glob("*.json"):
        category = addr_file.stem.replace("Addresses", "")
        try:
            with open(addr_file) as f:
                data = json.load(f)
                all_addresses[category] = data
        except Exception as e:
            print(f"  Warning: Could not load {addr_file}: {e}")
    
    return all_addresses


def get_contracts_to_verify(chain_addresses: Dict[str, Dict[str, str]]) -> Dict[str, str]:
    """Extract contracts to verify from chain addresses, excluding zero addresses and external contracts"""
    contracts = {}
    
    # Skip contracts that are external or not from evk-periphery
    skip_contracts = [
        "permit2",              # Uniswap's Permit2
        "feeCollector",         # Zero address placeholder
        "eUSDAdminTimelockController",  # Zero address placeholder
        # Gnosis Safe multisigs (external)
        "DAO", "labs", "securityCouncil", "securityPartnerA", "securityPartnerB",
        # LayerZero adapters (deployed from different repo)
        "eulOFTAdapter", "eusdOFTAdapter", "seusdOFTAdapter",
        # Tokens (deployed separately)
        "EUL", "WETH",
    ]
    zero_address = "0x0000000000000000000000000000000000000000"
    
    for category, addrs in chain_addresses.items():
        for name, address in addrs.items():
            if name in skip_contracts:
                continue
            if address == zero_address:
                continue
            contracts[name] = address
    
    return contracts


def checkout_evk_periphery(commit: str, quiet: bool = False) -> bool:
    """Checkout evk-periphery to a specific commit"""
    if not quiet:
        print(f"\n>>> Checking out evk-periphery to {commit}...")
    try:
        subprocess.run(
            ["git", "checkout", commit],
            cwd=EVK_PERIPHERY_DIR,
            check=True,
            capture_output=True,
            text=True
        )
        subprocess.run(
            ["git", "submodule", "update", "--init", "--recursive"],
            cwd=EVK_PERIPHERY_DIR,
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        if not quiet:
            print(f"Failed to checkout: {e}")
        return False


def hunt_for_commit(address: str, contract_key: str, fetcher, submodule_paths: List[str], 
                    commit_cache: Dict[str, str], max_commits: int = 20) -> Optional[Tuple[VerificationResult, str]]:
    """Try different commits to find one that matches the contract"""
    cache_key = f"{fetcher.chain_id}:{address.lower()}"
    
    # Check cache first
    if cache_key in commit_cache:
        cached_commit = commit_cache[cache_key]
        print(f"  Trying cached commit {cached_commit}...")
        if checkout_evk_periphery(cached_commit, quiet=True):
            comparator = SourceComparator(EVK_PERIPHERY_DIR, submodule_paths)
            result = verify_contract_silent(address, contract_key, fetcher, comparator)
            if result.status == "exact_match":
                return result, cached_commit
    
    # Get commits to try
    commits = get_recent_commits(max_commits)
    
    # Also add known deployment commits
    for known in COMMITS_TO_TRY:
        if known not in commits:
            commits.append(known)
    
    print(f"  Hunting through {len(commits)} commits...")
    
    for i, commit in enumerate(commits):
        if not checkout_evk_periphery(commit, quiet=True):
            continue
        
        comparator = SourceComparator(EVK_PERIPHERY_DIR, submodule_paths)
        result = verify_contract_silent(address, contract_key, fetcher, comparator)
        
        if result.status == "exact_match":
            print(f"  ✓ Found matching commit: {commit}")
            # Cache the result
            commit_cache[cache_key] = commit
            save_commit_cache(commit_cache)
            return result, commit
        
        # Progress indicator
        if (i + 1) % 10 == 0:
            print(f"    ...tried {i + 1}/{len(commits)} commits")
    
    return None


def verify_contract_silent(address: str, contract_key: str, fetcher, comparator) -> VerificationResult:
    """Verify a contract without printing (for commit hunting)"""
    etherscan_data = fetcher.get_verified_source(address)
    
    if not etherscan_data:
        return VerificationResult(
            contract_name=contract_key,
            address=address,
            etherscan_name="N/A",
            status="not_verified",
            diff="",
            files_checked=0,
            files_matched=0,
            error_message="Not verified on explorer"
        )
    
    etherscan_name = etherscan_data["contractName"]
    sources = etherscan_data.get("sources", {})
    diff, files_checked, files_matched = comparator.compare_sources(sources, etherscan_name)
    
    status = "exact_match" if diff == "" else "diff_found"
    
    return VerificationResult(
        contract_name=contract_key,
        address=address,
        etherscan_name=etherscan_name,
        status=status,
        diff=diff,
        files_checked=files_checked,
        files_matched=files_matched
    )


class BlockscoutFetcher:
    """Fetch verified source code from Blockscout API"""
    
    def __init__(self, chain_id: int):
        if chain_id not in BLOCKSCOUT_NETWORKS:
            raise ValueError(f"Chain {chain_id} not supported by Blockscout")
        
        self.chain_id = chain_id
        self.network_name, self.api_url, self.explorer_url = BLOCKSCOUT_NETWORKS[chain_id]
        
        self.cache_dir = CACHE_DIR / str(chain_id)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get_verified_source(self, address: str) -> Optional[Dict[str, Any]]:
        """Fetch verified source code from Blockscout"""
        cache_file = self.cache_dir / f"{address.lower()}.json"
        
        if cache_file.exists():
            print(f"  Using cached data for {address[:10]}...")
            with open(cache_file) as f:
                return json.load(f)
        
        print(f"  Fetching from Blockscout ({self.network_name})...")
        url = f"{self.api_url}?module=contract&action=getsourcecode&address={address}"
        
        try:
            response = requests.get(url, timeout=30)
            data = response.json()
            
            if data.get("status") != "1" and data.get("message") != "OK":
                print(f"  API error: {data.get('message', 'Unknown error')}")
                return None
            
            result = data.get("result", [{}])
            if isinstance(result, list):
                result = result[0] if result else {}
            
            if not result.get("SourceCode") or result["SourceCode"] == "":
                print(f"  Contract not verified")
                return None
            
            source_code = result["SourceCode"]
            contract_name = result.get("ContractName", "Unknown")
            main_filename = result.get("FileName", f"{contract_name}.sol")
            
            # Build sources dict
            sources = {}
            
            # Check if source code is JSON format (multi-file)
            if source_code.startswith("{{"):
                source_code = source_code[1:-1]
                parsed = json.loads(source_code)
                sources = parsed.get("sources", {})
            elif source_code.startswith("{"):
                try:
                    parsed = json.loads(source_code)
                    sources = parsed.get("sources", {})
                except json.JSONDecodeError:
                    # Single file
                    sources[main_filename] = {"content": source_code}
            else:
                # Single file - use FileName from result
                sources[main_filename] = {"content": source_code}
            
            # Add AdditionalSources if present (Blockscout format)
            additional = result.get("AdditionalSources", [])
            if isinstance(additional, list):
                for item in additional:
                    filename = item.get("Filename") or item.get("FileName", "")
                    content = item.get("SourceCode", "")
                    if filename and content:
                        sources[filename] = {"content": content}
            
            source_data = {
                "address": address,
                "contractName": contract_name,
                "compilerVersion": result.get("CompilerVersion", ""),
                "optimizationUsed": result.get("OptimizationUsed") == "1" or result.get("OptimizationUsed") == True,
                "runs": int(result.get("OptimizationRuns") or result.get("Runs") or 200),
                "evmVersion": result.get("EVMVersion", "default"),
                "sources": sources,
                "settings": result.get("CompilerSettings", {}),
            }
            
            with open(cache_file, "w") as f:
                json.dump(source_data, f, indent=2)
            
            print(f"  ✓ Found: {contract_name} ({len(sources)} files)")
            return source_data
            
        except Exception as e:
            print(f"  Error: {e}")
            return None


class EtherscanFetcher:
    """Fetch verified source code from Etherscan V2 API"""
    
    def __init__(self, chain_id: int, api_key: Optional[str] = None):
        self.chain_id = chain_id
        self.api_key = api_key or os.getenv("ETHERSCAN_API_KEY", "")
        
        if chain_id not in ETHERSCAN_NETWORKS:
            raise ValueError(f"Chain {chain_id} not supported")
        
        self.network_name, self.explorer_url = ETHERSCAN_NETWORKS[chain_id]
        
        # Create cache directory for this chain
        self.cache_dir = CACHE_DIR / str(chain_id)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get_verified_source(self, address: str) -> Optional[Dict[str, Any]]:
        """Fetch verified source code from Etherscan V2 unified API"""
        cache_file = self.cache_dir / f"{address.lower()}.json"
        
        # Check cache first
        if cache_file.exists():
            print(f"  Using cached data for {address[:10]}...")
            with open(cache_file) as f:
                return json.load(f)
        
        print(f"  Fetching from Etherscan V2 API ({self.network_name})...")
        url = f"{ETHERSCAN_V2_API}?chainid={self.chain_id}&module=contract&action=getsourcecode&address={address}&apikey={self.api_key}"
        
        try:
            response = requests.get(url, timeout=30)
            data = response.json()
            
            if data.get("status") != "1":
                print(f"  API error: {data.get('message', 'Unknown error')}")
                return None
            
            result = data["result"][0]
            
            if not result.get("SourceCode") or result["SourceCode"] == "":
                print(f"  Contract not verified")
                return None
            
            # Parse source code
            source_code = result["SourceCode"]
            
            # Handle JSON-formatted source code
            if source_code.startswith("{{"):
                source_code = source_code[1:-1]
                parsed = json.loads(source_code)
            elif source_code.startswith("{"):
                try:
                    parsed = json.loads(source_code)
                except json.JSONDecodeError:
                    parsed = {"sources": {result["ContractName"]: {"content": source_code}}}
            else:
                parsed = {"sources": {result["ContractName"]: {"content": source_code}}}
            
            source_data = {
                "address": address,
                "contractName": result["ContractName"],
                "compilerVersion": result["CompilerVersion"],
                "optimizationUsed": result.get("OptimizationUsed") == "1",
                "runs": int(result.get("Runs", 200)),
                "evmVersion": result.get("EVMVersion", "default"),
                "sources": parsed.get("sources", {}),
                "settings": parsed.get("settings", {}),
            }
            
            # Cache the result
            with open(cache_file, "w") as f:
                json.dump(source_data, f, indent=2)
            
            print(f"  ✓ Found: {result['ContractName']}")
            return source_data
            
        except Exception as e:
            print(f"  Error: {e}")
            return None


class SourceComparator:
    """Compare Etherscan source with local source files"""
    
    def __init__(self, repo_path: Path, submodule_paths: Optional[List[str]] = None):
        self.repo_path = repo_path
        self.submodule_paths = submodule_paths or []
    
    def find_local_file(self, etherscan_path: str) -> Optional[Path]:
        """Find the local file matching an Etherscan source path"""
        # Try direct match
        local_path = self.repo_path / etherscan_path
        if local_path.exists():
            return local_path
        
        # Try in submodule paths
        for submod_path in self.submodule_paths:
            local_path = self.repo_path / submod_path / etherscan_path
            if local_path.exists():
                return local_path
        
        # Try without leading directories
        parts = etherscan_path.split("/")
        for i in range(len(parts)):
            subpath = "/".join(parts[i:])
            local_path = self.repo_path / subpath
            if local_path.exists():
                return local_path
            for submod_path in self.submodule_paths:
                local_path = self.repo_path / submod_path / subpath
                if local_path.exists():
                    return local_path
        
        # Try in lib directory
        local_path = self.repo_path / "lib" / etherscan_path
        if local_path.exists():
            return local_path
        
        return None
    
    def normalize_source(self, content: str) -> str:
        """Normalize source code for comparison"""
        import re
        normalized = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', 'EMAIL_PLACEHOLDER', content)
        normalized = normalized.replace('\r\n', '\n')
        normalized = re.sub(r'from "solmate/src/', 'from "solmate/', normalized)
        normalized = re.sub(r'import "solmate/src/', 'import "solmate/', normalized)
        normalized = re.sub(r'from "\.\./\.\./lib/openzeppelin-contracts/', 'from "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'import "\.\./\.\./lib/openzeppelin-contracts/', 'import "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'from "\.\./lib/openzeppelin-contracts/', 'from "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'import "\.\./lib/openzeppelin-contracts/', 'import "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'from "openzeppelin-contracts/contracts/', 'from "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'import "openzeppelin-contracts/contracts/', 'import "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'from "\.\./lib/ethereum-vault-connector/src/', 'from "ethereum-vault-connector/', normalized)
        normalized = re.sub(r'import "\.\./lib/ethereum-vault-connector/src/', 'import "ethereum-vault-connector/', normalized)
        normalized = re.sub(r'// OpenZeppelin Contracts \(last updated v\d+\.\d+\.\d+\)', '// OpenZeppelin Contracts (last updated vX.X.X)', normalized)
        normalized = re.sub(r'/// @solidity memory-safe-assembly\s*\n\s*assembly \{', 'assembly ("memory-safe") {', normalized)
        normalized = re.sub(r'\bredeemption\b', 'redemption', normalized)
        normalized = '\n'.join(line.rstrip() for line in normalized.split('\n'))
        return normalized.strip()
    
    def compare_sources(self, etherscan_sources: Dict[str, Dict], contract_name: str) -> Tuple[str, int, int]:
        """Compare Etherscan sources with local sources"""
        patch = ""
        files_checked = 0
        files_matched = 0
        
        for source_path, source_data in etherscan_sources.items():
            etherscan_content = source_data.get("content", "")
            files_checked += 1
            
            local_file = self.find_local_file(source_path)
            
            if local_file is None:
                patch += f"\n=== FILE NOT FOUND: {source_path} ===\n"
                continue
            
            local_content = local_file.read_text()
            
            etherscan_normalized = self.normalize_source(etherscan_content)
            local_normalized = self.normalize_source(local_content)
            
            if etherscan_normalized == local_normalized:
                files_matched += 1
                continue
            
            diff_lines = list(unified_diff(
                etherscan_normalized.splitlines(keepends=True),
                local_normalized.splitlines(keepends=True),
                fromfile=f"Etherscan/{source_path}",
                tofile=f"Local/{source_path}",
            ))
            
            if diff_lines:
                patch += f"\n{'='*60}\nFILE: {source_path}\n{'='*60}\n"
                patch += "".join(diff_lines)
        
        return patch, files_checked, files_matched


def verify_contract(address: str, contract_key: str, fetcher: EtherscanFetcher, comparator: SourceComparator) -> VerificationResult:
    """Verify a single contract"""
    print(f"\n{'─'*50}")
    print(f"Checking {contract_key} ({address[:12]}...)")
    
    etherscan_data = fetcher.get_verified_source(address)
    
    if not etherscan_data:
        return VerificationResult(
            contract_name=contract_key,
            address=address,
            etherscan_name="N/A",
            status="not_verified",
            diff="",
            files_checked=0,
            files_matched=0,
            error_message="Not verified on explorer"
        )
    
    etherscan_name = etherscan_data["contractName"]
    sources = etherscan_data.get("sources", {})
    
    diff, files_checked, files_matched = comparator.compare_sources(sources, etherscan_name)
    
    if diff == "":
        print(f"  ✓ 100% MATCH ({files_matched}/{files_checked} files)")
        status = "exact_match"
    else:
        print(f"  ✗ Differences ({files_matched}/{files_checked} files)")
        status = "diff_found"
    
    return VerificationResult(
        contract_name=contract_key,
        address=address,
        etherscan_name=etherscan_name,
        status=status,
        diff=diff,
        files_checked=files_checked,
        files_matched=files_matched
    )


def generate_report(chain_id: int, network_name: str, explorer_url: str, results: List[VerificationResult]) -> str:
    """Generate markdown report for a network"""
    exact_matches = [r for r in results if r.status == "exact_match"]
    diffs_found = [r for r in results if r.status == "diff_found"]
    not_verified = [r for r in results if r.status == "not_verified"]
    errors = [r for r in results if r.status == "error"]
    
    report = f"""# {network_name.title()} Contract Verification Report

**Chain ID:** {chain_id}
**Explorer:** [{explorer_url}]({explorer_url})

## Summary

- **Verified Contracts:** {len(exact_matches)}/{len(results)} ✓
- **Differences Found:** {len(diffs_found)}
- **Not Verified on Explorer:** {len(not_verified)}
- **Errors:** {len(errors)}

## Contracts

| Contract | Address | Explorer Name | Status | Files |
|----------|---------|---------------|--------|-------|
"""
    
    for r in results:
        status_icon = {
            "exact_match": "✓ 100%",
            "diff_found": "✗ Diff",
            "not_verified": "- N/A",
            "error": "✗ Error"
        }.get(r.status, "?")
        
        explorer_link = f"[`{r.address[:10]}...`]({explorer_url}/address/{r.address})"
        report += f"| {r.contract_name} | {explorer_link} | {r.etherscan_name} | {status_icon} | {r.files_matched}/{r.files_checked} |\n"
    
    if diffs_found:
        report += "\n## Differences Found\n\n"
        for r in diffs_found:
            report += f"### {r.contract_name}\n\n```diff\n{r.diff[:3000]}{'...(truncated)' if len(r.diff) > 3000 else ''}\n```\n\n"
    
    if not_verified:
        report += "\n## Not Verified on Explorer\n\n"
        for r in not_verified:
            report += f"- {r.contract_name}: `{r.address}`\n"
    
    return report


def verify_network(chain_id: int) -> int:
    """Verify all contracts on a network"""
    if chain_id not in ETHERSCAN_NETWORKS:
        print(f"Chain {chain_id} not supported")
        return 1
    
    network_name, explorer_url = ETHERSCAN_NETWORKS[chain_id]
    
    print("="*60)
    print(f"Verifying {network_name.upper()} (Chain ID: {chain_id})")
    print("="*60)
    
    # Load addresses
    chain_addresses = load_chain_addresses(chain_id)
    if not chain_addresses:
        print(f"No addresses found for chain {chain_id}")
        return 1
    
    contracts = get_contracts_to_verify(chain_addresses)
    print(f"Found {len(contracts)} contracts to verify")
    
    # Check API key
    api_key = os.getenv("ETHERSCAN_API_KEY", "")
    if not api_key:
        print("\n⚠️  Warning: ETHERSCAN_API_KEY not set")
    
    # Check evk-periphery
    if not EVK_PERIPHERY_DIR.exists():
        print(f"\n✗ evk-periphery not found at {EVK_PERIPHERY_DIR}")
        return 1
    
    # Initialize
    fetcher = EtherscanFetcher(chain_id, api_key)
    submodule_paths = ["lib/euler-earn", "lib/reward-streams", "lib/ethereum-vault-connector", 
                       "lib/euler-swap", "lib/euler-vault-kit", "lib/fee-flow"]
    results = []
    
    # Checkout to master for now (most contracts deployed from recent commits)
    if not checkout_evk_periphery("master"):
        return 1
    
    comparator = SourceComparator(EVK_PERIPHERY_DIR, submodule_paths)
    
    # Verify all contracts
    for contract_key, address in contracts.items():
        result = verify_contract(address, contract_key, fetcher, comparator)
        results.append(result)
    
    # Try standalone repos for specific contracts
    standalone_contracts = {
        "eulerEarnFactory": EULER_EARN_DIR,
        "eulerSwapFactory": EULER_SWAP_DIR,
        "eulerSwapV1Factory": EULER_SWAP_DIR,
        "eulerSwapImplementation": EULER_SWAP_DIR,
        "eulerSwapV1Implementation": EULER_SWAP_DIR,
        "eulerSwapPeriphery": EULER_SWAP_DIR,
        "eulerSwapV1Periphery": EULER_SWAP_DIR,
    }
    
    # Re-verify contracts that had diffs with standalone repos
    for i, result in enumerate(results):
        if result.status == "diff_found" and result.contract_name in standalone_contracts:
            repo_dir = standalone_contracts[result.contract_name]
            if repo_dir.exists():
                print(f"\n>>> Retrying {result.contract_name} with standalone repo...")
                standalone_comparator = SourceComparator(repo_dir, [])
                new_result = verify_contract(
                    result.address, result.contract_name, fetcher, standalone_comparator
                )
                results[i] = new_result
    
    # Hunt for commits for contracts that still have diffs (if --hunt flag is set)
    if os.environ.get("HUNT_COMMITS") != "1":
        # Skip commit hunting
        pass
    else:
        commit_cache = load_commit_cache()
        contracts_with_diffs = [(i, r) for i, r in enumerate(results) 
                               if r.status == "diff_found" and r.contract_name not in standalone_contracts]
        
    if os.environ.get("HUNT_COMMITS") == "1" and contracts_with_diffs:
        print(f"\n{'='*60}")
        print(f"Hunting commits for {len(contracts_with_diffs)} contracts with diffs...")
        print("="*60)
        
        # Skip external contracts that we can't verify (Safe, EUL token, LayerZero)
        skip_names = {"SafeProxy", "MintBurnOFTAdapter", "ERC20BurnableMintable", "OFT"}
        
        for i, result in contracts_with_diffs:
            if result.etherscan_name in skip_names:
                print(f"\n>>> Skipping {result.contract_name} (external: {result.etherscan_name})")
                continue
            
            print(f"\n>>> Hunting commit for {result.contract_name}...")
            hunt_result = hunt_for_commit(
                result.address, result.contract_name, fetcher, 
                submodule_paths, commit_cache, max_commits=100
            )
            
            if hunt_result:
                new_result, commit = hunt_result
                results[i] = new_result
                print(f"  ✓ Matched at commit {commit}")
            else:
                print(f"  ✗ No matching commit found")
        
        # Return to master
        checkout_evk_periphery("master")
    
    # Generate report
    report = generate_report(chain_id, network_name, explorer_url, results)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = RESULTS_DIR / f"{network_name}-verification.md"
    report_path.write_text(report)
    print(f"\n✓ Report saved: {report_path}")
    
    # Summary
    exact_matches = sum(1 for r in results if r.status == "exact_match")
    print(f"\n{'='*60}")
    print(f"COMPLETE: {exact_matches}/{len(results)} contracts verified")
    print("="*60)
    
    return 0 if exact_matches == len(results) else 1


def verify_blockscout_network(chain_id: int) -> int:
    """Verify all contracts on a Blockscout network"""
    if chain_id not in BLOCKSCOUT_NETWORKS:
        print(f"Chain {chain_id} not supported by Blockscout")
        return 1
    
    network_name, api_url, explorer_url = BLOCKSCOUT_NETWORKS[chain_id]
    
    print("="*60)
    print(f"Verifying {network_name.upper()} (Chain ID: {chain_id}) via Blockscout")
    print("="*60)
    
    # Load addresses
    chain_addresses = load_chain_addresses(chain_id)
    if not chain_addresses:
        print(f"No addresses found for chain {chain_id}")
        return 1
    
    contracts = get_contracts_to_verify(chain_addresses)
    print(f"Found {len(contracts)} contracts to verify")
    
    # Check evk-periphery
    if not EVK_PERIPHERY_DIR.exists():
        print(f"\n✗ evk-periphery not found at {EVK_PERIPHERY_DIR}")
        return 1
    
    # Initialize
    fetcher = BlockscoutFetcher(chain_id)
    submodule_paths = ["lib/euler-earn", "lib/reward-streams", "lib/ethereum-vault-connector", 
                       "lib/euler-swap", "lib/euler-vault-kit", "lib/fee-flow"]
    results = []
    
    # Checkout to master
    if not checkout_evk_periphery("master"):
        return 1
    
    comparator = SourceComparator(EVK_PERIPHERY_DIR, submodule_paths)
    
    # Verify all contracts
    for contract_key, address in contracts.items():
        result = verify_contract(address, contract_key, fetcher, comparator)
        results.append(result)
    
    # Try standalone repos for specific contracts
    standalone_contracts = {
        "eulerEarnFactory": EULER_EARN_DIR,
        "eulerSwapFactory": EULER_SWAP_DIR,
        "eulerSwapV1Factory": EULER_SWAP_DIR,
        "eulerSwapImplementation": EULER_SWAP_DIR,
        "eulerSwapV1Implementation": EULER_SWAP_DIR,
        "eulerSwapPeriphery": EULER_SWAP_DIR,
        "eulerSwapV1Periphery": EULER_SWAP_DIR,
    }
    
    for i, result in enumerate(results):
        if result.status == "diff_found" and result.contract_name in standalone_contracts:
            repo_dir = standalone_contracts[result.contract_name]
            if repo_dir.exists():
                print(f"\n>>> Retrying {result.contract_name} with standalone repo...")
                standalone_comparator = SourceComparator(repo_dir, [])
                new_result = verify_contract(
                    result.address, result.contract_name, fetcher, standalone_comparator
                )
                results[i] = new_result
    
    # Generate report
    report = generate_report(chain_id, network_name, explorer_url, results)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = RESULTS_DIR / f"{network_name}-verification.md"
    report_path.write_text(report)
    print(f"\n✓ Report saved: {report_path}")
    
    # Summary
    exact_matches = sum(1 for r in results if r.status == "exact_match")
    print(f"\n{'='*60}")
    print(f"COMPLETE: {exact_matches}/{len(results)} contracts verified")
    print("="*60)
    
    return 0 if exact_matches == len(results) else 1


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python verify_networks.py <chain_id|all|blockscout> [--hunt]")
        print("\nOptions:")
        print("  --hunt    Hunt for matching commits when diffs are found")
        print("\nEtherscan V2 chains:")
        for chain_id, (name, _) in sorted(ETHERSCAN_NETWORKS.items()):
            print(f"  {chain_id}: {name}")
        print("\nBlockscout chains:")
        for chain_id, (name, _, _) in sorted(BLOCKSCOUT_NETWORKS.items()):
            print(f"  {chain_id}: {name}")
        return 1
    
    # Check for --hunt flag
    hunt_commits = "--hunt" in sys.argv
    if hunt_commits:
        sys.argv.remove("--hunt")
        os.environ["HUNT_COMMITS"] = "1"
    
    arg = sys.argv[1]
    
    if arg == "all":
        # Verify all Etherscan-supported networks (except mainnet which is separate)
        failed = []
        for chain_id in sorted(ETHERSCAN_NETWORKS.keys()):
            if chain_id == 1:
                continue  # Skip mainnet, use verify_mainnet.py
            result = verify_network(chain_id)
            if result != 0:
                failed.append(chain_id)
        
        if failed:
            print(f"\n⚠️  Failed chains: {failed}")
            return 1
        return 0
    elif arg == "blockscout":
        # Verify all Blockscout-supported networks
        failed = []
        for chain_id in sorted(BLOCKSCOUT_NETWORKS.keys()):
            result = verify_blockscout_network(chain_id)
            if result != 0:
                failed.append(chain_id)
        
        if failed:
            print(f"\n⚠️  Failed chains: {failed}")
            return 1
        return 0
    else:
        try:
            chain_id = int(arg)
            # Check if it's Etherscan or Blockscout
            if chain_id in ETHERSCAN_NETWORKS:
                return verify_network(chain_id)
            elif chain_id in BLOCKSCOUT_NETWORKS:
                return verify_blockscout_network(chain_id)
            else:
                print(f"Chain {chain_id} not supported")
                return 1
        except ValueError:
            print(f"Invalid chain ID: {arg}")
            return 1


if __name__ == "__main__":
    sys.exit(main())
