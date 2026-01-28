"""
Known commits, deployment hints, and contract-to-repo mapping.
"""

from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

from .config import ROOT_DIR

# =============================================================================
# REPOSITORY PATHS
# =============================================================================

EVK_PERIPHERY_DIR = ROOT_DIR / "repos" / "evk-periphery"
EULER_EARN_DIR = ROOT_DIR / "repos" / "euler-earn-standalone"
EULER_SWAP_DIR = ROOT_DIR / "repos" / "euler-swap-standalone"

# =============================================================================
# KNOWN COMMITS
# =============================================================================

# Global known commits that work across many networks
GLOBAL_COMMITS: List[str] = [
    "master",
    "main",
    "2b087370",      # Core contracts deployment
    "5e066711",      # Oracle router update
    "392c7bd0",
    "6fee729e",
    "a11037fa",
    "f61809fd",      # rEUL deployment
    "dec63c2a",
    "4edac34f",
    "773453b",       # euler-earn deployment (Blockscout networks)
    "8aa230b",       # euler-earn certora branch
    "deploy-swell",  # Swell-specific balanceTracker
]

# EulerSwap V1 always uses this tag
EULERSWAP_V1_TAG = "eulerswap-1.0"

# Contracts that use the EulerSwap V1 tag
EULERSWAP_V1_CONTRACTS: Set[str] = {
    "eulerSwapV1Factory",
    "eulerSwapV1Implementation",
    "eulerSwapV1Periphery",
}

# =============================================================================
# NETWORK-SPECIFIC HINTS
# =============================================================================

# Network-specific commit hints: network_name -> {contract_name -> commit}
NETWORK_HINTS: Dict[str, Dict[str, str]] = {
    "mainnet": {
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
    },
    "swell": {
        "balanceTracker": "deploy-swell",
        "eulerEarnFactory": "773453b",
    },
    "sonic": {
        "eulerEarnFactory": "773453b",
    },
    "bob": {
        "eulerEarnFactory": "773453b",
    },
    "berachain": {
        "eulerEarnFactory": "773453b",
    },
    "unichain": {
        "eulerEarnFactory": "773453b",
        "balanceTracker": "deploy-swell",
    },
}

# =============================================================================
# CONTRACT TO REPO MAPPING
# =============================================================================

# Contract name -> (repo_name, github_url, submodule_path_in_evk_periphery)
# submodule_path is None for standalone repos
CONTRACT_REPOS: Dict[str, Tuple[str, str, Optional[str]]] = {
    # Core (via evk-periphery submodules)
    "evc": ("ethereum-vault-connector", "euler-xyz/ethereum-vault-connector", "lib/ethereum-vault-connector"),
    "eVaultFactory": ("euler-vault-kit", "euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "eVaultImplementation": ("euler-vault-kit", "euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "protocolConfig": ("euler-vault-kit", "euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "sequenceRegistry": ("euler-vault-kit", "euler-xyz/euler-vault-kit", "lib/euler-vault-kit"),
    "balanceTracker": ("reward-streams", "euler-xyz/reward-streams", "lib/reward-streams"),
    
    # Euler Earn (standalone repo)
    "eulerEarnFactory": ("euler-earn", "euler-xyz/euler-earn", None),
    "eulerEarnPublicAllocator": ("euler-earn", "euler-xyz/euler-earn", None),
    
    # EulerSwap V1 (standalone repo @ eulerswap-1.0 tag)
    "eulerSwapV1Factory": ("euler-swap", "euler-xyz/euler-swap", None),
    "eulerSwapV1Implementation": ("euler-swap", "euler-xyz/euler-swap", None),
    "eulerSwapV1Periphery": ("euler-swap", "euler-xyz/euler-swap", None),
    
    # EulerSwap V2 (in evk-periphery via lib/euler-swap)
    "eulerSwapV2Factory": ("euler-swap", "euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Implementation": ("euler-swap", "euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Periphery": ("euler-swap", "euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2ProtocolFeeConfig": ("euler-swap", "euler-xyz/euler-swap", "lib/euler-swap"),
    "eulerSwapV2Registry": ("euler-swap", "euler-xyz/euler-swap", "lib/euler-swap"),
    
    # Fee Flow
    "feeFlowController": ("fee-flow", "euler-xyz/fee-flow", "lib/fee-flow"),
    
    # Periphery (evk-periphery main repo)
    "adaptiveCurveIRMFactory": ("evk-periphery", "euler-xyz/evk-periphery", None),
    "fixedCyclicalBinaryIRMFactory": ("evk-periphery", "euler-xyz/evk-periphery", None),
    "kinkIRMFactory": ("evk-periphery", "euler-xyz/evk-periphery", None),
    "kinkyIRMFactory": ("evk-periphery", "euler-xyz/evk-periphery", None),
    "governorAccessControlEmergencyFactory": ("evk-periphery", "euler-xyz/evk-periphery", None),
    "oracleRouterFactory": ("evk-periphery", "euler-xyz/evk-periphery", None),
    "swapVerifier": ("evk-periphery", "euler-xyz/evk-periphery", None),
    
    # Token contracts (evk-periphery)
    "rEUL": ("evk-periphery", "euler-xyz/evk-periphery", None),
    
    # Bridge contracts (evk-periphery)
    "eulOFTAdapter": ("evk-periphery", "euler-xyz/evk-periphery", None),
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_repo_for_contract(contract_name: str) -> Tuple[str, str, Optional[str]]:
    """
    Get repository info for a contract.
    
    Returns:
        Tuple of (repo_name, github_path, submodule_path)
        submodule_path is None for standalone repos
    """
    return CONTRACT_REPOS.get(contract_name, ("evk-periphery", "euler-xyz/evk-periphery", None))


def get_repo_path(contract_name: str) -> Path:
    """Get the local repository path for a contract."""
    repo_name, _, submodule = get_repo_for_contract(contract_name)
    
    # Standalone repos
    if contract_name in EULERSWAP_V1_CONTRACTS:
        return EULER_SWAP_DIR
    if contract_name in {"eulerEarnFactory", "eulerEarnPublicAllocator"}:
        return EULER_EARN_DIR
    
    # evk-periphery or its submodules
    return EVK_PERIPHERY_DIR


def get_submodule_paths(contract_name: str) -> List[str]:
    """Get submodule paths to search for a contract's source files."""
    _, _, submodule = get_repo_for_contract(contract_name)
    
    if submodule:
        return [submodule]
    
    # Default submodules for evk-periphery contracts
    return [
        "lib/ethereum-vault-connector",
        "lib/euler-vault-kit",
        "lib/reward-streams",
        "lib/fee-flow",
        "lib/euler-price-oracle",
        "lib/euler-swap",
        "lib/openzeppelin-contracts",
    ]


def get_commits_to_try(contract_name: str, network_name: str) -> List[str]:
    """
    Get ordered list of commits to try for a contract.
    
    Prioritizes:
    1. Network-specific hint for this contract
    2. EulerSwap V1 tag for V1 contracts
    3. Global known commits
    """
    commits = []
    
    # Network-specific hint
    hint = NETWORK_HINTS.get(network_name, {}).get(contract_name)
    if hint:
        commits.append(hint)
    
    # EulerSwap V1 uses specific tag
    if contract_name in EULERSWAP_V1_CONTRACTS:
        commits.append(EULERSWAP_V1_TAG)
        commits.extend(["master", "main"])
        return commits
    
    # Add global commits
    for commit in GLOBAL_COMMITS:
        if commit not in commits:
            commits.append(commit)
    
    return commits


def get_github_url(contract_name: str, commit: str) -> str:
    """Get GitHub URL for a contract at a specific commit."""
    repo_name, github_path, _ = get_repo_for_contract(contract_name)
    return f"https://github.com/{github_path}/tree/{commit}"
