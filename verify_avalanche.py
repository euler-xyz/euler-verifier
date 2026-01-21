#!/usr/bin/env python3
"""
Avalanche Contract Verification

Verifies Euler contracts on Avalanche (Chain ID: 43114) by:
1. Finding the exact deployment commit (exhaustive search)
2. Verifying source matches at that commit
3. Showing diff between deployment commit and master
"""

import json
import os
import sys
import subprocess
import requests
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, field
from difflib import unified_diff

# Paths
ROOT_DIR = Path(__file__).parent
EVK_PERIPHERY_DIR = ROOT_DIR / "repos" / "evk-periphery"
EULER_EARN_DIR = ROOT_DIR / "repos" / "euler-earn-standalone"
EULER_SWAP_DIR = ROOT_DIR / "repos" / "euler-swap-standalone"
RESULTS_DIR = ROOT_DIR / "results"
CACHE_DIR = ROOT_DIR / "cache" / "etherscan"
COMMIT_CACHE_FILE = ROOT_DIR / "cache" / "deployment_commits.json"

# Chain Configuration
CHAIN_ID = 43114
CHAIN_NAME = "avalanche"
EXPLORER_URL = "https://snowtrace.io"

# Snowtrace API (direct, not via Etherscan V2)
SNOWTRACE_API = "https://api.snowtrace.io/api"

# GitHub URLs
EVK_PERIPHERY_URL = "https://github.com/euler-xyz/evk-periphery"
EULER_EARN_URL = "https://github.com/euler-xyz/euler-earn"
EULER_SWAP_URL = "https://github.com/euler-xyz/euler-swap"

# =============================================================================
# FOCUSED CONTRACT LIST
# =============================================================================

FOCUSED_CONTRACTS = {
    # Core contracts (from euler-vault-kit via evk-periphery)
    "evc": "0xddcbe30A761Edd2e19bba930A977475265F36Fa1",
    "eVaultFactory": "0xaf4B4c18B17F6a2B32F6c398a3910bdCD7f26181",
    "eVaultImplementation": "0x29E9b639e165d919FEcf02521F8A9dA0492D4f21",
    "protocolConfig": "0x8564160f30926eA1229DCcf24118c6De155D2e30",
    "sequenceRegistry": "0x9C38f923baC407C818312EADEf69AdC116fd16FD",
    "balanceTracker": "0xAf5659428FEF1F6a701FaB46d8f3aF8371A9913D",
    
    # Euler Earn (from euler-earn standalone)
    "eulerEarnFactory": "0x574B00f5a0C56D370F19fa887a5545d74F52fAC2",
    
    # EulerSwap V1 (from euler-swap standalone @ eulerswap-1.0 tag)
    "eulerSwapV1Factory": "0x8A1D3a4850ed7deeC9003680Cf41b8E75D27e440",
    "eulerSwapV1Implementation": "0x4F4FDeE3568aC31C46634fb2Df3FF44A156Be351",
    "eulerSwapV1Periphery": "0x31F34124a37f94efd17201A1B88d5008cD444c72",
    
    # EulerSwap V2 (from evk-periphery master via lib/euler-swap)
    "eulerSwapV2Factory": "0xd80e68B39e4408cb7D6c8E3343Bde46587013F62",
    "eulerSwapV2Implementation": "0x2836825daeC3D5d8fD3ad71d61f72345bB868110",
    "eulerSwapV2Periphery": "0x4fef2f7146c0b4e6C0b1433badC6B7a2E1E7ECDb",
    "eulerSwapV2ProtocolFeeConfig": "0x1C0e8b841DA677C685D2a8376773e8A872C1ce5C",
    "eulerSwapV2Registry": "0xF9f2dF8A5Cc71a0424dfA9EbdfdfF8A082C19184",
    
    # IRM Factories (from evk-periphery)
    "adaptiveCurveIRMFactory": "0x104BA4D746cf71F23341a7c855271A5E7dD19F58",
    "fixedCyclicalBinaryIRMFactory": "0x53A37B5d8a30a49bCB463eF33d610d5E5040C64A",
    "kinkIRMFactory": "0xcad498936E09f38f18eD8375AeCD1d46689e7086",
    "kinkyIRMFactory": "0x34E21196d7A303EE06c25aEF3B9CCD111c15c9aC",
    
    # Periphery (from evk-periphery)
    "eulerEarnPublicAllocator": "0x2524762ddb853AB1e572B81E5E6377a8a1536aA5",
    "feeFlowController": "0x95F21cD90057BBdC6fAc3f9b94D06b53C24B278c",
    "governorAccessControlEmergencyFactory": "0xcA14D397219808F39724607e6401bD8C46CbF65f",
    "oracleRouterFactory": "0x80528F014E84658e85D3C6D4896A29Fa933Be696",
    "swapVerifier": "0x0d7938D9c31Cd7dD693752074284af133c1142de",
    
    # Bridge/Token (from separate repos)
    "eulOFTAdapter": "0xF1A5F97AB84158Cf6d8ba8dEF68780Fc2Fd64310",
    "rEUL": "0x2e3b32730B4F6b6502BdAa9122df3B026eDE5391",
}

# Known deployment commits (hints for faster search)
DEPLOYMENT_HINTS = {
    "evc": "2b087370",
    "eVaultFactory": "2b087370",
    "eVaultImplementation": "2b087370",
    "protocolConfig": "2b087370",
    "sequenceRegistry": "2b087370",
    "balanceTracker": "2b087370",
    "feeFlowController": "2b087370",
    "kinkIRMFactory": "2b087370",
    "swapVerifier": "2b087370",
    "oracleRouterFactory": "5e066711",
    "adaptiveCurveIRMFactory": "master",
    "fixedCyclicalBinaryIRMFactory": "master",
    "kinkyIRMFactory": "master",
    "governorAccessControlEmergencyFactory": "master",
    # rEUL - found the correct commit
    "rEUL": "f61809fd",
}

# Contracts from standalone repos (not evk-periphery)
STANDALONE_CONTRACTS = {
    "eulerEarnFactory": ("euler-earn", EULER_EARN_DIR),
    "eulerEarnPublicAllocator": ("euler-earn", EULER_EARN_DIR),
    "eulerSwapV1Factory": ("euler-swap-v1", EULER_SWAP_DIR),
    "eulerSwapV1Implementation": ("euler-swap-v1", EULER_SWAP_DIR),
    "eulerSwapV1Periphery": ("euler-swap-v1", EULER_SWAP_DIR),
}

# =============================================================================
# SOURCE REPOSITORY MAPPING
# =============================================================================
# Maps each contract to its actual source repository (where the code lives)
# Format: contract_name -> (repo_name, repo_url, submodule_path_in_evk_periphery)

SOURCE_REPOS = {
    # EVC - Ethereum Vault Connector
    "evc": ("ethereum-vault-connector", "https://github.com/euler-xyz/ethereum-vault-connector", "lib/ethereum-vault-connector"),
    
    # Euler Vault Kit contracts
    "eVaultFactory": ("euler-vault-kit", "https://github.com/euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "eVaultImplementation": ("euler-vault-kit", "https://github.com/euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "protocolConfig": ("euler-vault-kit", "https://github.com/euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "sequenceRegistry": ("euler-vault-kit", "https://github.com/euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    
    # Reward Streams
    "balanceTracker": ("reward-streams", "https://github.com/euler-xyz/reward-streams", "lib/reward-streams"),
    
    # rEUL is native to evk-periphery (not from reward-streams)
    "rEUL": ("evk-periphery", "https://github.com/euler-xyz/evk-periphery", None),
    
    # Fee Flow
    "feeFlowController": ("fee-flow", "https://github.com/euler-xyz/fee-flow", "lib/fee-flow"),
    
    # Euler Earn
    "eulerEarnFactory": ("euler-earn", "https://github.com/euler-xyz/euler-earn", "lib/euler-earn"),
    "eulerEarnPublicAllocator": ("euler-earn", "https://github.com/euler-xyz/euler-earn", "lib/euler-earn"),
    
    # Euler Swap V1 (from standalone repo, tag eulerswap-1.0)
    "eulerSwapV1Factory": ("euler-swap", "https://github.com/euler-xyz/euler-swap", None),
    "eulerSwapV1Implementation": ("euler-swap", "https://github.com/euler-xyz/euler-swap", None),
    "eulerSwapV1Periphery": ("euler-swap", "https://github.com/euler-xyz/euler-swap", None),
    
    # Euler Swap V2 (via evk-periphery submodule)
    "eulerSwapV2Factory": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Implementation": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Periphery": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2ProtocolFeeConfig": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Registry": ("euler-swap", "https://github.com/euler-xyz/euler-swap", "lib/euler-swap"),
    
    # Price Oracle
    "oracleRouterFactory": ("euler-price-oracle", "https://github.com/euler-xyz/euler-price-oracle", "lib/euler-price-oracle"),
    
    # Native evk-periphery contracts (source IS evk-periphery)
    "adaptiveCurveIRMFactory": ("evk-periphery", "https://github.com/euler-xyz/evk-periphery", None),
    "fixedCyclicalBinaryIRMFactory": ("evk-periphery", "https://github.com/euler-xyz/evk-periphery", None),
    "kinkIRMFactory": ("evk-periphery", "https://github.com/euler-xyz/evk-periphery", None),
    "kinkyIRMFactory": ("evk-periphery", "https://github.com/euler-xyz/evk-periphery", None),
    "governorAccessControlEmergencyFactory": ("evk-periphery", "https://github.com/euler-xyz/evk-periphery", None),
    "swapVerifier": ("evk-periphery", "https://github.com/euler-xyz/evk-periphery", None),
    "eulOFTAdapter": ("evk-periphery", "https://github.com/euler-xyz/evk-periphery", None),
}

# Known source commits for standalone deployments
STANDALONE_COMMITS = {
    "eulerSwapV1Factory": "eulerswap-1.0",
    "eulerSwapV1Implementation": "eulerswap-1.0",
    "eulerSwapV1Periphery": "eulerswap-1.0",
}


@dataclass
# =============================================================================
# DATA CLASSES
# =============================================================================

class VerificationResult:
    contract_name: str
    address: str
    etherscan_name: str
    status: str  # "exact_match", "diff_found", "no_match", "error"
    files_checked: int
    files_matched: int
    deployment_commit: Optional[str] = None  # Exact evk-periphery commit where deployed
    diff_vs_etherscan: str = ""  # Diff between Etherscan and local (at deployment commit)
    diff_vs_master: str = ""  # Diff between deployment commit and master
    # Source repository information
    source_repo_name: str = "evk-periphery"  # e.g., "euler-vault-kit", "ethereum-vault-connector"
    source_repo_url: str = EVK_PERIPHERY_URL  # e.g., "https://github.com/euler-xyz/euler-vault-kit"
    source_commit: Optional[str] = None  # Commit in the source repo (may differ from evk-periphery commit)
    evk_periphery_commit: Optional[str] = None  # The evk-periphery commit (for reference)
    error_message: Optional[str] = None


# =============================================================================
# GIT UTILITIES
# =============================================================================

def get_git_commits(repo_dir: Path, limit: int = 100) -> List[str]:
    """Get recent commits from a repo"""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{limit}", "--format=%h"],
            cwd=repo_dir, capture_output=True, text=True, check=True
        )
        return result.stdout.strip().split("\n")
    except:
        return []


def get_submodule_commit(repo_dir: Path, evk_commit: str, submodule_path: str) -> Optional[str]:
    """
    Get the commit hash of a submodule at a specific evk-periphery commit.
    Uses git ls-tree to find what commit the submodule was pinned to.
    """
    try:
        result = subprocess.run(
            ["git", "ls-tree", evk_commit, submodule_path],
            cwd=repo_dir, capture_output=True, text=True, check=True
        )
        # Output format: "160000 commit <hash>\t<path>"
        parts = result.stdout.strip().split()
        if len(parts) >= 3:
            return parts[2][:8]  # Return short hash
    except subprocess.CalledProcessError:
        pass
    return None


def get_source_repo_info(contract_key: str, evk_commit: Optional[str]) -> Tuple[str, str, Optional[str]]:
    """
    Get source repository info for a contract.
    Returns (repo_name, repo_url, source_commit)
    
    source_commit is the commit in the actual source repo (not evk-periphery)
    """
    if contract_key not in SOURCE_REPOS:
        return ("evk-periphery", EVK_PERIPHERY_URL, evk_commit)
    
    repo_name, repo_url, submodule_path = SOURCE_REPOS[contract_key]
    
    # For standalone contracts with known commits
    if contract_key in STANDALONE_COMMITS:
        return (repo_name, repo_url, STANDALONE_COMMITS[contract_key])
    
    # For native evk-periphery contracts
    if repo_name == "evk-periphery":
        return (repo_name, repo_url, evk_commit)
    
    # For submodule-based contracts, get the submodule commit
    if submodule_path and evk_commit:
        submod_commit = get_submodule_commit(EVK_PERIPHERY_DIR, evk_commit, submodule_path)
        if submod_commit:
            return (repo_name, repo_url, submod_commit)
    
    return (repo_name, repo_url, None)


def checkout_repo(repo_dir: Path, commit: str, quiet: bool = True) -> bool:
    """Checkout a repo to a specific commit"""
    try:
        # Force checkout to handle dirty submodules
        subprocess.run(["git", "checkout", "-f", commit], cwd=repo_dir,
                      check=True, capture_output=True, text=True)
        # Try normal submodule update first
        result = subprocess.run(["git", "submodule", "update", "--init", "--recursive"],
                      cwd=repo_dir, capture_output=True, text=True)
        
        # If it failed, try to manually checkout key submodules
        if result.returncode != 0:
            # Get the pinned submodule commits for this commit
            for submod in ["lib/openzeppelin-contracts", "lib/ethereum-vault-connector"]:
                submod_path = repo_dir / submod
                if submod_path.exists():
                    try:
                        # Get the commit hash pinned in the main repo
                        ls_tree = subprocess.run(
                            ["git", "ls-tree", commit, submod],
                            cwd=repo_dir, capture_output=True, text=True
                        )
                        if ls_tree.returncode == 0 and ls_tree.stdout.strip():
                            parts = ls_tree.stdout.strip().split()
                            if len(parts) >= 3:
                                submod_commit = parts[2]
                                # Fetch and checkout in submodule
                                subprocess.run(["git", "fetch", "origin"], 
                                             cwd=submod_path, capture_output=True)
                                subprocess.run(["git", "checkout", "-f", submod_commit],
                                             cwd=submod_path, capture_output=True)
                    except:
                        pass
        return True
    except subprocess.CalledProcessError:
        return False


def get_diff_between_commits(repo_dir: Path, from_commit: str, to_commit: str, 
                             files: List[str] = None) -> str:
    """
    Get git diff between two commits for specific files.
    Only diffs the files that were verified on Etherscan, excluding lib/ dependencies.
    """
    try:
        cmd = ["git", "diff", from_commit, to_commit]
        
        if files:
            # Filter to only include source files (not lib/ dependencies)
            source_files = [f for f in files if not f.startswith('lib/') and '/lib/' not in f]
            if source_files:
                cmd.append("--")
                cmd.extend(source_files)
            else:
                # All files are lib/ - no source diff to show
                return ""
        
        result = subprocess.run(cmd, cwd=repo_dir, capture_output=True, text=True)
        return result.stdout
    except:
        return ""


def get_source_repo_diff(contract_key: str, source_commit: str, etherscan_files: List[str]) -> str:
    """
    Get diff from the actual source repo (not evk-periphery) between deployment commit and master.
    For submodule contracts, diffs within the submodule directory.
    For native evk-periphery contracts, diffs within evk-periphery.
    """
    if contract_key not in SOURCE_REPOS:
        return ""
    
    repo_name, repo_url, submodule_path = SOURCE_REPOS[contract_key]
    
    if not source_commit or source_commit == "master":
        return ""
    
    # Determine which directory to diff in
    if submodule_path:
        # For submodule contracts, diff within the submodule
        repo_dir = EVK_PERIPHERY_DIR / submodule_path
    else:
        # For native evk-periphery contracts
        repo_dir = EVK_PERIPHERY_DIR
    
    if not repo_dir.exists():
        return ""
    
    try:
        # Fetch latest from origin to ensure we have master
        subprocess.run(["git", "fetch", "origin"], cwd=repo_dir, capture_output=True)
        
        # Filter and transform Etherscan file paths for the source repo
        relevant_files = []
        submodule_prefix = submodule_path + "/" if submodule_path else None
        
        for f in etherscan_files:
            # For submodule contracts: paths are like "lib/ethereum-vault-connector/src/..."
            # We need to strip the submodule_path prefix to get paths relative to the submodule
            if submodule_prefix:
                if f.startswith(submodule_prefix):
                    # Strip the submodule prefix: "lib/ethereum-vault-connector/src/X.sol" -> "src/X.sol"
                    relative_path = f[len(submodule_prefix):]
                    relevant_files.append(relative_path)
            else:
                # Native evk-periphery files - skip external libs
                if not f.startswith('lib/'):
                    relevant_files.append(f)
        
        if not relevant_files:
            return ""
        
        # Generate diff
        cmd = ["git", "diff", source_commit, "origin/master", "--"]
        cmd.extend(relevant_files)
        
        result = subprocess.run(cmd, cwd=repo_dir, capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        return f"Error generating diff: {e}"


# =============================================================================
# DIFF PROCESSING
# =============================================================================

def summarize_lib_changes(diff: str) -> Tuple[str, List[str]]:
    """
    Separate lib/ changes from source changes.
    Returns (filtered_diff, list_of_lib_files_changed)
    Handles both git diff format and custom comparison format.
    """
    if not diff:
        return diff, []
    
    lib_files = []
    filtered_lines = []
    skip_section = False
    current_file = None
    
    lines = diff.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Git diff format: diff --git a/path b/path
        if line.startswith('diff --git'):
            parts = line.split(' ')
            if len(parts) >= 3:
                file_path = parts[2].lstrip('a/')
                if file_path.startswith('lib/') or '/lib/' in file_path:
                    lib_files.append(file_path)
                    skip_section = True
                else:
                    skip_section = False
        
        # Custom format: FILE: path or === FILE: path ===
        elif 'FILE:' in line:
            # Extract path after FILE:
            if 'FILE:' in line:
                idx = line.index('FILE:')
                file_path = line[idx + 5:].strip().rstrip('=').strip()
                if file_path.startswith('lib/') or '/lib/' in file_path:
                    lib_files.append(file_path)
                    skip_section = True
                else:
                    skip_section = False
        
        # Custom format: --- Etherscan/path or +++ Local/path
        elif line.startswith('--- ') or line.startswith('+++ '):
            path = line[4:].strip()
            # Remove Etherscan/ or Local/ prefix
            for prefix in ['Etherscan/', 'Local/']:
                if path.startswith(prefix):
                    path = path[len(prefix):]
                    break
            if path.startswith('lib/') or '/lib/' in path:
                lib_files.append(path)
                skip_section = True
            else:
                # Reset skip for non-lib files
                skip_section = False
        
        # Separator line - reset section tracking
        elif line.startswith('=' * 20):
            skip_section = False
        
        if not skip_section:
            filtered_lines.append(line)
        
        i += 1
    
    # Deduplicate lib files (keep unique base paths)
    lib_dirs = set()
    for f in lib_files:
        # Extract the lib name (e.g., lib/openzeppelin-contracts)
        parts = f.split('/')
        if len(parts) >= 2:
            lib_dirs.add('/'.join(parts[:2]))
    
    return '\n'.join(filtered_lines), sorted(lib_dirs)


def filter_comment_only_changes(diff: str) -> str:
    """
    Filter out diff hunks that only contain comment changes.
    Keeps hunks with actual code changes.
    """
    import re
    
    if not diff:
        return diff
    
    # Pattern to match comment-only lines (both added and removed)
    comment_patterns = [
        r'^\s*//.*$',           # Single-line comment
        r'^\s*/\*.*$',          # Start of multi-line comment
        r'^\s*\*.*$',           # Middle of multi-line comment
        r'^\s*\*/.*$',          # End of multi-line comment
        r'^\s*\*\s*@.*$',       # Doc comment annotations
        r'^\s*$',               # Empty lines
    ]
    combined_pattern = '|'.join(f'({p})' for p in comment_patterns)
    
    def is_comment_or_empty(line: str) -> bool:
        """Check if a line (without +/- prefix) is a comment or empty"""
        return bool(re.match(combined_pattern, line))
    
    def hunk_has_code_changes(hunk_lines: List[str]) -> bool:
        """Check if a hunk has actual code changes (not just comments)"""
        for line in hunk_lines:
            if line.startswith('+') or line.startswith('-'):
                # Skip the diff header lines
                if line.startswith('+++') or line.startswith('---'):
                    continue
                # Get the content without the +/- prefix
                content = line[1:]
                if not is_comment_or_empty(content):
                    return True
        return False
    
    # Parse diff into file sections
    result_lines = []
    current_file_header = []
    current_hunk = []
    in_hunk = False
    
    for line in diff.split('\n'):
        # File header starts
        if line.startswith('diff --git'):
            # Flush previous hunk if any
            if current_hunk and hunk_has_code_changes(current_hunk):
                result_lines.extend(current_file_header)
                result_lines.extend(current_hunk)
            current_file_header = [line]
            current_hunk = []
            in_hunk = False
        # File metadata
        elif line.startswith('index ') or line.startswith('--- ') or line.startswith('+++ '):
            current_file_header.append(line)
        # Hunk header
        elif line.startswith('@@'):
            # Flush previous hunk if any
            if current_hunk and hunk_has_code_changes(current_hunk):
                result_lines.extend(current_file_header)
                result_lines.extend(current_hunk)
                current_file_header = []  # Already added
            current_hunk = [line]
            in_hunk = True
        # Hunk content
        elif in_hunk:
            current_hunk.append(line)
    
    # Flush last hunk
    if current_hunk and hunk_has_code_changes(current_hunk):
        result_lines.extend(current_file_header)
        result_lines.extend(current_hunk)
    
    return '\n'.join(result_lines)


# =============================================================================
# CACHING
# =============================================================================

def load_commit_cache() -> Dict[str, str]:
    """Load cached deployment commits"""
    if COMMIT_CACHE_FILE.exists():
        try:
            with open(COMMIT_CACHE_FILE) as f:
                return json.load(f)
        except:
            pass
    return {}


def save_commit_cache(cache: Dict[str, str]):
    """Save deployment commit cache"""
    COMMIT_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(COMMIT_CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


# =============================================================================
# ETHERSCAN API
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
        
        print(f"    Fetching from Etherscan...", flush=True)
        url = f"{SNOWTRACE_API}?module=contract&action=getsourcecode&address={address}&apikey={self.api_key}"
        
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
    
    def find_local_file(self, etherscan_path: str) -> Optional[Path]:
        local_path = self.repo_path / etherscan_path
        if local_path.exists():
            return local_path
        
        for submod_path in self.submodule_paths:
            local_path = self.repo_path / submod_path / etherscan_path
            if local_path.exists():
                return local_path
        
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
        
        return None
    
    def normalize_source(self, content: str) -> str:
        import re
        normalized = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', 'EMAIL', content)
        normalized = normalized.replace('\r\n', '\n')
        
        # Normalize import paths
        normalized = re.sub(r'from "solmate/src/', 'from "solmate/', normalized)
        normalized = re.sub(r'import "solmate/src/', 'import "solmate/', normalized)
        normalized = re.sub(r'from "\.\./+lib/openzeppelin-contracts/contracts/', 'from "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'import "\.\./+lib/openzeppelin-contracts/contracts/', 'import "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'from "\.\./+lib/openzeppelin-contracts/', 'from "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'import "\.\./+lib/openzeppelin-contracts/', 'import "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'from "openzeppelin-contracts/contracts/', 'from "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'import "openzeppelin-contracts/contracts/', 'import "openzeppelin-contracts/', normalized)
        normalized = re.sub(r'from "\.\./+lib/ethereum-vault-connector/src/', 'from "ethereum-vault-connector/', normalized)
        normalized = re.sub(r'import "\.\./+lib/ethereum-vault-connector/src/', 'import "ethereum-vault-connector/', normalized)
        normalized = re.sub(r'from "ethereum-vault-connector/src/', 'from "ethereum-vault-connector/', normalized)
        normalized = re.sub(r'import "ethereum-vault-connector/src/', 'import "ethereum-vault-connector/', normalized)
        normalized = re.sub(r'from "\.\./+lib/reward-streams/src/', 'from "reward-streams/', normalized)
        normalized = re.sub(r'import "\.\./+lib/reward-streams/src/', 'import "reward-streams/', normalized)
        normalized = re.sub(r'from "\.\./+lib/euler-earn/src/', 'from "euler-earn/', normalized)
        normalized = re.sub(r'import "\.\./+lib/euler-earn/src/', 'import "euler-earn/', normalized)
        
        # OpenZeppelin version comments
        normalized = re.sub(r'// OpenZeppelin Contracts \(last updated v\d+\.\d+\.\d+\)', '// OpenZeppelin Contracts', normalized)
        
        # Assembly syntax
        normalized = re.sub(r'/// @solidity memory-safe-assembly\s*\n\s*assembly \{', 'assembly ("memory-safe") {', normalized)
        
        normalized = '\n'.join(line.rstrip() for line in normalized.split('\n'))
        return normalized.strip()
    
    def compare_sources(self, etherscan_sources: Dict[str, Dict], contract_name: str) -> Tuple[str, int, int]:
        """Compare sources. Returns (diff, files_checked, files_matched)"""
        diff = ""
        files_checked = 0
        files_matched = 0
        
        for source_path, source_data in etherscan_sources.items():
            etherscan_content = source_data.get("content", "")
            files_checked += 1
            
            local_file = self.find_local_file(source_path)
            if local_file is None:
                diff += f"\n=== FILE NOT FOUND: {source_path} ===\n"
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
                diff += f"\n{'='*60}\nFILE: {source_path}\n{'='*60}\n"
                diff += "".join(diff_lines)
        
        return diff, files_checked, files_matched


# =============================================================================
# COMMIT SEARCH & VERIFICATION
# =============================================================================

def exhaustive_commit_search(address: str, contract_key: str, fetcher: EtherscanFetcher,
                             repo_dir: Path, submodule_paths: List[str],
                             commit_cache: Dict[str, str], max_commits: int = 100) -> Optional[str]:
    """
    Exhaustively search for the exact deployment commit.
    Returns the commit hash if found, None otherwise.
    """
    cache_key = f"mainnet:{address.lower()}"
    
    # Check cache first
    if cache_key in commit_cache:
        cached = commit_cache[cache_key]
        print(f"    Trying cached commit {cached}...", flush=True)
        if checkout_repo(repo_dir, cached):
            comparator = SourceComparator(repo_dir, submodule_paths)
            etherscan_data = fetcher.get_verified_source(address)
            if etherscan_data:
                diff, _, _ = comparator.compare_sources(etherscan_data["sources"], etherscan_data["contractName"])
                if diff == "":
                    return cached
    
    # Build commit list: hints first, then recent commits
    commits_to_try = []
    
    # Add hint if available
    hint = DEPLOYMENT_HINTS.get(contract_key)
    if hint:
        commits_to_try.append(hint)
    
    # Add master
    if "master" not in commits_to_try:
        commits_to_try.append("master")
    
    # Add known deployment commits
    known_commits = ["2b087370", "5e066711", "a11037fa", "6fee729e", "392c7bd0", "4cc0478d",
                     "f61809fd",  # rEUL deployment commit
                     "a6a8024b90b334806c0d99b7bab3b10b45a74bc5", "2f0ddfb0e438d02fc5bb13ad1fb7cae61c2e09eb"]
    for c in known_commits:
        if c not in commits_to_try:
            commits_to_try.append(c)
    
    # Add recent commits from git log
    recent = get_git_commits(repo_dir, max_commits)
    for c in recent:
        if c not in commits_to_try:
            commits_to_try.append(c)
    
    print(f"    Searching {len(commits_to_try)} commits...", flush=True)
    
    etherscan_data = fetcher.get_verified_source(address)
    if not etherscan_data:
        return None
    
    for i, commit in enumerate(commits_to_try):
        if not checkout_repo(repo_dir, commit):
            continue
        
        comparator = SourceComparator(repo_dir, submodule_paths)
        diff, files_checked, files_matched = comparator.compare_sources(
            etherscan_data["sources"], etherscan_data["contractName"]
        )
        
        if diff == "":
            print(f"    ✓ Found exact match at commit {commit}", flush=True)
            # Cache the result
            commit_cache[cache_key] = commit
            save_commit_cache(commit_cache)
            return commit
        
        # Progress every 20 commits
        if (i + 1) % 20 == 0:
            print(f"    ...checked {i + 1}/{len(commits_to_try)} commits", flush=True)
    
    return None


def verify_standalone_contract(contract_key: str, address: str, fetcher: EtherscanFetcher,
                               repo_name: str, repo_dir: Path) -> VerificationResult:
    """Verify a contract from a standalone repo"""
    # Get source repo info
    source_repo_name, source_repo_url, source_commit = get_source_repo_info(contract_key, None)
    
    if not repo_dir.exists():
        return VerificationResult(
            contract_name=contract_key, address=address, etherscan_name="N/A",
            status="error", files_checked=0, files_matched=0,
            source_repo_name=source_repo_name, source_repo_url=source_repo_url,
            error_message=f"Repo not found: {repo_dir}"
        )
    
    # Handle euler-swap versions
    target_commit = source_commit or "master"
    if repo_name == "euler-swap-v1":
        target_commit = "eulerswap-1.0"
        checkout_repo(repo_dir, target_commit)
    
    comparator = SourceComparator(repo_dir, [])
    etherscan_data = fetcher.get_verified_source(address)
    
    if not etherscan_data:
        return VerificationResult(
            contract_name=contract_key, address=address, etherscan_name="N/A",
            status="error", files_checked=0, files_matched=0,
            source_repo_name=source_repo_name, source_repo_url=source_repo_url,
            error_message="Not verified on Etherscan"
        )
    
    diff, files_checked, files_matched = comparator.compare_sources(
        etherscan_data["sources"], etherscan_data["contractName"]
    )
    
    # Generate diff to master if not deployed from master - only for Etherscan source files
    diff_to_master = ""
    if target_commit != "master":
        source_files = list(etherscan_data["sources"].keys())
        diff_to_master = get_diff_between_commits(repo_dir, target_commit, "master", source_files)
    
    if diff == "":
        status = "exact_match"
    else:
        status = "diff_found"
    
    return VerificationResult(
        contract_name=contract_key, address=address, 
        etherscan_name=etherscan_data["contractName"],
        status=status, files_checked=files_checked, files_matched=files_matched,
        deployment_commit=target_commit, diff_vs_etherscan=diff, diff_vs_master=diff_to_master,
        source_repo_name=source_repo_name, source_repo_url=source_repo_url,
        source_commit=target_commit, evk_periphery_commit=None  # Standalone - no evk-periphery
    )


def verify_evk_periphery_contract(contract_key: str, address: str, fetcher: EtherscanFetcher,
                                   submodule_paths: List[str], commit_cache: Dict[str, str]) -> VerificationResult:
    """Verify a contract from evk-periphery with exhaustive commit search"""
    
    etherscan_data = fetcher.get_verified_source(address)
    if not etherscan_data:
        source_repo_name, source_repo_url, _ = get_source_repo_info(contract_key, None)
        return VerificationResult(
            contract_name=contract_key, address=address, etherscan_name="N/A",
            status="error", files_checked=0, files_matched=0,
            source_repo_name=source_repo_name, source_repo_url=source_repo_url,
            error_message="Not verified on Etherscan"
        )
    
    # Exhaustively search for the deployment commit
    deployment_commit = exhaustive_commit_search(
        address, contract_key, fetcher, EVK_PERIPHERY_DIR, 
        submodule_paths, commit_cache
    )
    
    # Get source repo info based on the found commit
    source_repo_name, source_repo_url, source_commit = get_source_repo_info(contract_key, deployment_commit)
    
    if deployment_commit:
        # Found exact match
        checkout_repo(EVK_PERIPHERY_DIR, deployment_commit)
        comparator = SourceComparator(EVK_PERIPHERY_DIR, submodule_paths)
        _, files_checked, files_matched = comparator.compare_sources(
            etherscan_data["sources"], etherscan_data["contractName"]
        )
        
        # Generate diff between deployment commit and master in the SOURCE repo
        diff_to_master = ""
        if source_commit and source_commit != "master":
            source_files = list(etherscan_data["sources"].keys())
            diff_to_master = get_source_repo_diff(contract_key, source_commit, source_files)
        
        return VerificationResult(
            contract_name=contract_key, address=address,
            etherscan_name=etherscan_data["contractName"],
            status="exact_match", files_checked=files_checked, files_matched=files_matched,
            deployment_commit=deployment_commit, diff_vs_master=diff_to_master,
            source_repo_name=source_repo_name, source_repo_url=source_repo_url,
            source_commit=source_commit, evk_periphery_commit=deployment_commit
        )
    else:
        # No exact match found - generate diff vs master
        print(f"    ✗ No exact match found, showing diff vs master", flush=True)
        checkout_repo(EVK_PERIPHERY_DIR, "master")
        comparator = SourceComparator(EVK_PERIPHERY_DIR, submodule_paths)
        diff, files_checked, files_matched = comparator.compare_sources(
            etherscan_data["sources"], etherscan_data["contractName"]
        )
        
        return VerificationResult(
            contract_name=contract_key, address=address,
            etherscan_name=etherscan_data["contractName"],
            status="no_match", files_checked=files_checked, files_matched=files_matched,
            deployment_commit=None, diff_vs_etherscan=diff,
            source_repo_name=source_repo_name, source_repo_url=source_repo_url,
            source_commit=None, evk_periphery_commit=None
        )


# =============================================================================
# REPORT GENERATION
# =============================================================================

def generate_report(results: List[VerificationResult]) -> str:
    """Generate verification report with deployment commits and diffs to master"""
    
    exact = [r for r in results if r.status == "exact_match"]
    no_match = [r for r in results if r.status == "no_match"]
    diff_found = [r for r in results if r.status == "diff_found"]
    errors = [r for r in results if r.status == "error"]
    
    report = f"""# Avalanche Contract Verification Report

## Summary

| Status | Count |
|--------|-------|
| ✓ Verified (exact match) | {len(exact)} |
| ✗ No exact commit found | {len(no_match)} |
| ~ Standalone with diff | {len(diff_found)} |
| - Error | {len(errors)} |
| **Total** | **{len(results)}** |

## Verified Contracts

| Contract | Address | Source Repo | Source Commit | evk-periphery | Files |
|----------|---------|-------------|---------------|---------------|-------|
"""
    
    for r in sorted(results, key=lambda x: (x.status != "exact_match", x.contract_name)):
        addr_link = f"[`{r.address[:10]}...`]({EXPLORER_URL}/address/{r.address})"
        
        # Source repo with link
        source_repo_link = f"[{r.source_repo_name}]({r.source_repo_url})"
        
        # Source commit with link
        if r.source_commit:
            source_commit_link = f"[`{r.source_commit}`]({r.source_repo_url}/tree/{r.source_commit})"
        else:
            source_commit_link = "-"
        
        # evk-periphery commit (informational)
        if r.evk_periphery_commit:
            if r.evk_periphery_commit == "master":
                evk_commit_link = f"[`master`]({EVK_PERIPHERY_URL})"
            else:
                evk_commit_link = f"[`{r.evk_periphery_commit}`]({EVK_PERIPHERY_URL}/tree/{r.evk_periphery_commit})"
        else:
            evk_commit_link = "-"
        
        # Status indicator
        if r.status == "exact_match":
            status = "✓"
        elif r.status == "no_match":
            status = "✗"
            source_commit_link = "not found"
        elif r.status == "diff_found":
            status = "~"
        else:
            status = "-"
        
        report += f"| {status} {r.contract_name} | {addr_link} | {source_repo_link} | {source_commit_link} | {evk_commit_link} | {r.files_matched}/{r.files_checked} |\n"
    
    # Section: Changes since deployment (diff to master)
    # Include ALL contracts not deployed from master (where source_commit != "master")
    contracts_with_changes = [
        r for r in results 
        if r.status == "exact_match" 
        and r.source_commit 
        and r.source_commit != "master"
    ]
    
    report += f"""

## Changes Since Deployment

This section shows what has changed in the source code between the deployment commit and current `master`.
These diffs help identify any changes made to the codebase after deployment.

"""
    
    if not contracts_with_changes:
        report += "_No changes detected - all contracts deployed from master._\n"
    else:
        # Group by source repo for better organization
        from collections import defaultdict
        by_repo = defaultdict(list)
        for r in contracts_with_changes:
            by_repo[r.source_repo_name].append(r)
        
        for repo_name, repo_results in sorted(by_repo.items()):
            report += f"### {repo_name}\n\n"
            
            for r in repo_results:
                # Determine which repo/commit to show diff from
                if r.source_repo_name == "evk-periphery":
                    compare_url = f"{EVK_PERIPHERY_URL}/compare/{r.source_commit}...master"
                    commit_url = f"{EVK_PERIPHERY_URL}/tree/{r.source_commit}"
                else:
                    compare_url = f"{r.source_repo_url}/compare/{r.source_commit}...master"
                    commit_url = f"{r.source_repo_url}/tree/{r.source_commit}"
                
                report += f"""#### {r.contract_name}

- **Deployed from:** [`{r.source_commit}`]({commit_url})
- **Compare to master:** [`{r.source_commit}...master`]({compare_url})
"""
                if r.evk_periphery_commit and r.source_repo_name != "evk-periphery":
                    report += f"- **evk-periphery:** [`{r.evk_periphery_commit}`]({EVK_PERIPHERY_URL}/tree/{r.evk_periphery_commit})\n"
                
                report += "\n"
                
                if r.diff_vs_master:
                    # Filter out comment-only changes for cleaner output
                    filtered_diff = filter_comment_only_changes(r.diff_vs_master)
                    
                    if filtered_diff.strip():
                        # Truncate to ~100 lines
                        diff_lines = filtered_diff.split('\n')
                        if len(diff_lines) > 100:
                            diff_preview = '\n'.join(diff_lines[:100])
                            report += f"```diff\n{diff_preview}\n```\n\n"
                            report += f"_Showing first 100 of {len(diff_lines)} lines. [View full diff on GitHub]({compare_url})_\n\n"
                        else:
                            report += f"```diff\n{filtered_diff}\n```\n\n"
                    else:
                        report += "_Only comment/documentation changes - see GitHub compare link for details._\n\n"
                else:
                    report += "_No diff available - see GitHub compare link above._\n\n"
    
    # Section: Contracts without exact match (diff vs master)
    if no_match:
        report += f"""

## Contracts Without Exact Match

These contracts could not be matched to any commit in the repository.
Showing diff between Etherscan source and current `master`:

"""
        for r in no_match:
            report += f"""### {r.contract_name}

- **Address:** [`{r.address}`]({EXPLORER_URL}/address/{r.address})
- **Etherscan Name:** {r.etherscan_name}
- **Source Repo:** [{r.source_repo_name}]({r.source_repo_url})
- **Files:** {r.files_matched}/{r.files_checked} matched against master
- **Compared against:** [`{r.source_repo_name} @ master`]({r.source_repo_url})

"""
            if r.diff_vs_etherscan:
                # Separate lib/ changes from source changes
                filtered_diff, lib_dirs = summarize_lib_changes(r.diff_vs_etherscan)
                
                # Show lib/ changes as summary
                if lib_dirs:
                    report += f"**External Dependencies (lib/):**\n"
                    for lib_dir in lib_dirs:
                        report += f"- `{lib_dir}` - version differences\n"
                    report += "\n"
                
                # Filter out comment-only changes from remaining diff
                if filtered_diff.strip():
                    filtered_diff = filter_comment_only_changes(filtered_diff)
                
                if filtered_diff.strip():
                    report += "**Source Code Differences:**\n\n"
                    diff_lines = filtered_diff.split('\n')
                    if len(diff_lines) > 100:
                        diff_preview = '\n'.join(diff_lines[:100])
                        report += f"```diff\n{diff_preview}\n```\n\n"
                        report += f"_Showing first 100 of {len(diff_lines)} lines. [View full diff on GitHub]({r.source_repo_url}/compare/master...master)_\n\n"
                    else:
                        report += f"```diff\n{filtered_diff}\n```\n\n"
                elif not lib_dirs:
                    report += "_No significant differences found._\n\n"
    
    return report


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def main():
    # Force unbuffered output
    import sys
    sys.stdout.reconfigure(line_buffering=True)
    
    print("="*60, flush=True)
    print(f"AVALANCHE CONTRACT VERIFICATION (Chain ID: {CHAIN_ID})", flush=True)
    print("="*60, flush=True)
    
    api_key = os.getenv("ETHERSCAN_API_KEY", "")
    if not api_key:
        print("⚠️  ETHERSCAN_API_KEY not set", flush=True)
    else:
        print(f"✓ ETHERSCAN_API_KEY set ({api_key[:8]}...)", flush=True)
    
    if not EVK_PERIPHERY_DIR.exists():
        print(f"✗ evk-periphery not found at {EVK_PERIPHERY_DIR}", flush=True)
        return 1
    
    print(f"✓ evk-periphery found at {EVK_PERIPHERY_DIR}", flush=True)
    
    fetcher = EtherscanFetcher(api_key)
    submodule_paths = ["lib/euler-earn", "lib/reward-streams", "lib/ethereum-vault-connector",
                       "lib/euler-swap", "lib/euler-vault-kit", "lib/fee-flow"]
    commit_cache = load_commit_cache()
    results = []
    
    print(f"\nVerifying {len(FOCUSED_CONTRACTS)} contracts...\n", flush=True)
    
    for contract_key, address in FOCUSED_CONTRACTS.items():
        print(f"{'─'*50}", flush=True)
        print(f"{contract_key} ({address[:12]}...)", flush=True)
        
        # Check if standalone contract
        if contract_key in STANDALONE_CONTRACTS:
            repo_name, repo_dir = STANDALONE_CONTRACTS[contract_key]
            print(f"  Using {repo_name} standalone...", flush=True)
            result = verify_standalone_contract(contract_key, address, fetcher, repo_name, repo_dir)
        else:
            # evk-periphery contract - exhaustive search
            result = verify_evk_periphery_contract(
                contract_key, address, fetcher, submodule_paths, commit_cache
            )
        
        # Print status
        if result.status == "exact_match":
            print(f"  ✓ VERIFIED @ {result.deployment_commit} ({result.files_matched}/{result.files_checked} files)", flush=True)
            if result.diff_vs_master:
                print(f"    → Changes since deployment: {len(result.diff_vs_master)} chars diff", flush=True)
        elif result.status == "no_match":
            print(f"  ✗ NO MATCH ({result.files_matched}/{result.files_checked} files vs master)", flush=True)
        elif result.status == "diff_found":
            print(f"  ~ DIFF ({result.files_matched}/{result.files_checked} files)", flush=True)
        else:
            print(f"  - ERROR: {result.error_message}", flush=True)
        
        results.append(result)
    
    # Return to master
    checkout_repo(EVK_PERIPHERY_DIR, "master")
    
    # Generate report
    report = generate_report(results)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = RESULTS_DIR / f"{CHAIN_NAME}.md"
    report_path.write_text(report)
    
    # Summary
    verified = sum(1 for r in results if r.status == "exact_match")
    print(f"\n{'='*60}", flush=True)
    print(f"COMPLETE: {verified}/{len(results)} verified with exact commit match", flush=True)
    print(f"Report: {report_path}", flush=True)
    print("="*60)
    
    return 0 if verified == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
