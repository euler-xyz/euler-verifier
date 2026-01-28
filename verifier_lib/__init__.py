"""
Euler Contract Verifier Library

Unified verification system for Euler protocol contracts across multiple networks.
"""

from .config import NetworkConfig, load_networks
from .addresses import load_contracts, VERIFIABLE_CONTRACTS
from .cache import CommitMatchCache
from .comparator import SourceComparator
from .commits import (
    GLOBAL_COMMITS, 
    EULERSWAP_V1_TAG, 
    EULERSWAP_V1_CONTRACTS,
    CONTRACT_REPOS,
    NETWORK_HINTS,
    get_commits_to_try,
    get_repo_path,
    get_submodule_paths,
)
from .fetchers import create_fetcher, BaseFetcher
from .report import generate_report, VerificationResult

__all__ = [
    # Config
    "NetworkConfig",
    "load_networks",
    # Addresses
    "load_contracts",
    "VERIFIABLE_CONTRACTS",
    # Cache
    "CommitMatchCache",
    # Comparator
    "SourceComparator",
    # Commits
    "GLOBAL_COMMITS",
    "EULERSWAP_V1_TAG",
    "EULERSWAP_V1_CONTRACTS",
    "CONTRACT_REPOS",
    "NETWORK_HINTS",
    "get_commits_to_try",
    "get_repo_path",
    "get_submodule_paths",
    # Fetchers
    "create_fetcher",
    "BaseFetcher",
    # Report
    "generate_report",
    "VerificationResult",
]
