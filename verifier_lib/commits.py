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
    "4edac34f",      # Linea deployment
    "773453b",       # euler-earn deployment (Blockscout networks)
    "8aa230b",       # euler-earn certora branch
    "deploy-swell",  # Swell-specific balanceTracker (tag)
    "origin/deployment-script",  # euler-earn special deployment branch
    "origin/development",        # Development branch (newer deployments)
    "origin/fix-new-deployments",  # Fix branch for newer networks
    "origin/custom-scripts-tac",   # TAC deployment scripts
    "origin/swell",                # Swell deployment branch
    "9f541916",                    # Updated EVC with virtual change
    "06d1708e",                    # euler-earn lens update
    "46e486d9",                    # Dependency update
    "334e93ed",                    # Latest master branches
    "d3b0d7fd",                    # Latest master branches (alt)
    "8695c72c",                    # Refactored deployment scripts
    "08a3fee3",                    # Pre-ERC20Synth (eulOFTAdapter without virtual mint)
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
    "base": {
        "balanceTracker": "deploy-swell",
    },
    "linea": {
        "eulerEarnFactory": "origin/deployment-script",
        "eulerEarnPublicAllocator": "origin/deployment-script",
        # On Linea, eulerSwapV1 was deployed from evk-periphery at 4edac34f
        "eulerSwapV1Factory": "4edac34f",
        "eulerSwapV1Implementation": "4edac34f",
        "eulerSwapV1Periphery": "4edac34f",
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
    "monad": {},
}

# =============================================================================
# STANDALONE REPO FALLBACK
# =============================================================================

# Contracts that can be verified via standalone repo or with nested submodule overrides
# when the normal evk-periphery commit search fails.
# Maps contract_name -> (repo_dir_name, commits_to_try, nested_submodule_overrides)
# nested_submodule_overrides: list of (submodule_path, versions_to_try)
# When multiple overrides are specified, all combinations are tried.
STANDALONE_FALLBACKS: Dict[str, Tuple[str, List[str], List[Tuple[str, List[str]]]]] = {
    "feeFlowController": (
        "fee-flow-standalone",
        ["5e5f6bd", "9cfbd05", "3bee858", "master", "4a419c9"],
        [],
    ),
    "balanceTracker": (
        "reward-streams-standalone",
        ["master", "9eb7b8a"],
        [
            ("lib/ethereum-vault-connector", ["dc3be15", "e6550e6", "e64ca4a"]),
            ("lib/openzeppelin-contracts", ["v5.1.0", "v5.0.2", "v5.0.1", "v5.0.0"]),
        ],
    ),
    "eulerSwapV2Factory": (
        "euler-swap-standalone",
        ["master", "81cf6dc", "b948f40"],
        [("lib/openzeppelin-contracts", ["v5.1.0", "v5.0.2", "v5.0.1", "v5.0.0"])],
    ),
    "eulerSwapV2Implementation": (
        "euler-swap-standalone",
        ["master", "81cf6dc", "b948f40"],
        [("lib/openzeppelin-contracts", ["v5.1.0", "v5.0.2", "v5.0.1", "v5.0.0"])],
    ),
    "eulerSwapV2Periphery": (
        "euler-swap-standalone",
        ["master", "81cf6dc", "b948f40"],
        [("lib/openzeppelin-contracts", ["v5.1.0", "v5.0.2", "v5.0.1", "v5.0.0"])],
    ),
    "eulerSwapV2Registry": (
        "euler-swap-standalone",
        ["master", "81cf6dc", "b948f40"],
        [("lib/openzeppelin-contracts", ["v5.1.0", "v5.0.2", "v5.0.1", "v5.0.0"])],
    ),
    "eulerEarnFactory": (
        "euler-earn-standalone",
        ["master"],
        [("lib/openzeppelin-contracts", ["v5.1.0", "v5.0.2", "v5.0.1"])],
    ),
    "oracleRouterFactory": (
        "evk-periphery",
        ["master"],
        [
            ("lib/euler-price-oracle/lib/ethereum-vault-connector", ["dc3be15", "e6550e6", "e64ca4a"]),
            ("lib/euler-price-oracle/lib/forge-std", ["v1.9.4", "v1.9.3", "v1.9.2"]),
        ],
    ),
    # EulerSwap V1 on newer networks uses euler-swap standalone (not eulerswap-1.0 tag)
    "eulerSwapV1Factory": (
        "euler-swap-standalone",
        ["5d270c7", "b948f40", "master", "81cf6dc"],
        [("lib/openzeppelin-contracts", ["v5.2.0", "v5.1.0"])],
    ),
    "eulerSwapV1Implementation": (
        "euler-swap-standalone",
        ["5d270c7", "b948f40", "master", "81cf6dc"],
        [("lib/openzeppelin-contracts", ["v5.2.0", "v5.1.0"])],
    ),
    "eulerSwapV1Periphery": (
        "euler-swap-standalone",
        ["98c05c5", "5d270c7", "b948f40", "master", "81cf6dc"],
        [("lib/openzeppelin-contracts", ["v5.2.0", "v5.1.0"])],
    ),
}

# =============================================================================
# CONTRACT TO REPO MAPPING
# =============================================================================

# Network-specific repo overrides for contracts deployed differently on certain networks
NETWORK_REPO_OVERRIDES: Dict[str, Dict[str, Tuple[str, str, Optional[str]]]] = {
    "linea": {
        "eulerSwapV1Factory": ("euler-swap", "euler-xyz/euler-swap", "lib/euler-swap"),
        "eulerSwapV1Implementation": ("euler-swap", "euler-xyz/euler-swap", "lib/euler-swap"),
        "eulerSwapV1Periphery": ("euler-swap", "euler-xyz/euler-swap", "lib/euler-swap"),
    },
    # On monad, euler-earn contracts are deployed from evk-periphery (files prefixed with lib/euler-earn/)
    "monad": {
        "eulerEarnPublicAllocator": ("euler-earn", "euler-xyz/euler-earn", "lib/euler-earn"),
    },
}

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
    "oracleRouterFactory": ("euler-price-oracle", "euler-xyz/euler-price-oracle", "lib/euler-price-oracle"),
    "swapVerifier": ("evk-periphery", "euler-xyz/evk-periphery", None),
    
    # Token contracts (evk-periphery)
    "rEUL": ("evk-periphery", "euler-xyz/evk-periphery", None),
    
    # Bridge contracts (evk-periphery)
    "eulOFTAdapter": ("evk-periphery", "euler-xyz/evk-periphery", None),
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_repo_for_contract(contract_name: str, network: Optional[str] = None) -> Tuple[str, str, Optional[str]]:
    """
    Get repository info for a contract.
    
    Args:
        contract_name: Name of the contract
        network: Optional network name for network-specific overrides
    
    Returns:
        Tuple of (repo_name, github_path, submodule_path)
        submodule_path is None for standalone repos
    """
    # Check network-specific overrides first
    if network and network in NETWORK_REPO_OVERRIDES:
        if contract_name in NETWORK_REPO_OVERRIDES[network]:
            return NETWORK_REPO_OVERRIDES[network][contract_name]
    
    return CONTRACT_REPOS.get(contract_name, ("evk-periphery", "euler-xyz/evk-periphery", None))


def get_repo_path(contract_name: str, network: Optional[str] = None) -> Path:
    """Get the local repository path for a contract."""
    repo_name, _, submodule = get_repo_for_contract(contract_name, network)
    
    # Standalone repos (only if no network override)
    if network not in NETWORK_REPO_OVERRIDES or contract_name not in NETWORK_REPO_OVERRIDES.get(network, {}):
        if contract_name in EULERSWAP_V1_CONTRACTS:
            return EULER_SWAP_DIR
        if contract_name in {"eulerEarnFactory", "eulerEarnPublicAllocator"}:
            return EULER_EARN_DIR
    
    # evk-periphery or its submodules (including network-overridden contracts)
    return EVK_PERIPHERY_DIR


def get_submodule_paths(contract_name: str, network: Optional[str] = None) -> List[str]:
    """Get submodule paths to search for a contract's source files."""
    repo_name, _, submodule = get_repo_for_contract(contract_name, network)
    
    if submodule:
        return [submodule]
    
    # Standalone repos (euler-earn, euler-swap standalone) use no submodule paths
    if repo_name in ("euler-earn", "euler-swap") and submodule is None:
        # Check if network override makes it a submodule
        if network and network in NETWORK_REPO_OVERRIDES:
            override = NETWORK_REPO_OVERRIDES[network].get(contract_name)
            if override and override[2]:  # Has submodule path in override
                return [override[2]]
        return []
    
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
    2. EulerSwap V1 tag for V1 contracts (unless network override exists)
    3. Global known commits
    """
    commits = []
    
    # Network-specific hint
    hint = NETWORK_HINTS.get(network_name, {}).get(contract_name)
    if hint:
        commits.append(hint)
    
    # Check if this contract has a network-specific repo override
    has_network_override = (
        network_name in NETWORK_REPO_OVERRIDES and 
        contract_name in NETWORK_REPO_OVERRIDES[network_name]
    )
    
    # EulerSwap V1 uses specific tag - but only if no network override
    if contract_name in EULERSWAP_V1_CONTRACTS and not has_network_override:
        if EULERSWAP_V1_TAG not in commits:
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


def get_submodule_commit(evk_commit: str, submodule_path: str) -> Optional[str]:
    """
    Get the commit hash of a submodule at a specific evk-periphery commit.
    Uses git ls-tree to find what commit the submodule was pinned to.
    
    Args:
        evk_commit: The evk-periphery commit to check
        submodule_path: Path to the submodule (e.g., "lib/ethereum-vault-connector")
    
    Returns:
        The submodule commit hash, or None if not found
    """
    import subprocess
    
    try:
        result = subprocess.run(
            ["git", "ls-tree", evk_commit, submodule_path],
            cwd=EVK_PERIPHERY_DIR,
            capture_output=True,
            text=True,
            check=True,
        )
        # Output format: "160000 commit <hash>\t<path>"
        parts = result.stdout.strip().split()
        if len(parts) >= 3:
            return parts[2]  # The commit hash
        return None
    except subprocess.CalledProcessError:
        return None


def get_source_commit(contract_name: str, evk_commit: Optional[str], network: Optional[str] = None) -> Tuple[str, str, Optional[str]]:
    """
    Get source repository info and actual source commit for a contract.
    
    For contracts from submodules, resolves the actual submodule commit.
    For native evk-periphery contracts, returns the evk_commit.
    
    Args:
        contract_name: Name of the contract
        evk_commit: The evk-periphery commit where match was found
        network: Optional network name for network-specific handling
    
    Returns:
        Tuple of (repo_name, github_url, source_commit)
    """
    repo_name, github_path, submodule_path = get_repo_for_contract(contract_name, network)
    repo_url = f"https://github.com/{github_path}"
    
    # Check if this contract has a network-specific repo override
    has_network_override = (
        network and 
        network in NETWORK_REPO_OVERRIDES and 
        contract_name in NETWORK_REPO_OVERRIDES[network]
    )
    
    # Standalone contracts (euler-earn, euler-swap v1) - but not if network override
    if contract_name in EULERSWAP_V1_CONTRACTS and not has_network_override:
        return (repo_name, repo_url, EULERSWAP_V1_TAG)
    
    if contract_name in {"eulerEarnFactory", "eulerEarnPublicAllocator"}:
        # Euler-earn standalone - evk_commit IS the source commit
        return (repo_name, repo_url, evk_commit)
    
    # Native evk-periphery contracts (no submodule)
    if repo_name == "evk-periphery" or not submodule_path:
        return (repo_name, repo_url, evk_commit)
    
    # For submodule-based contracts, resolve the actual submodule commit
    if submodule_path and evk_commit:
        submod_commit = get_submodule_commit(evk_commit, submodule_path)
        if submod_commit:
            return (repo_name, repo_url, submod_commit)
    
    return (repo_name, repo_url, None)
