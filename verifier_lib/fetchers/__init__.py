"""
API Fetchers for different block explorer APIs.
"""

from .base import BaseFetcher
from .etherscan import EtherscanV2Fetcher
from .blockscout import BlockscoutV2Fetcher
from .sourcify import SourcifyFetcher

def create_fetcher(config) -> BaseFetcher:
    """Create appropriate fetcher based on network config."""
    if config.api_type == "etherscan_v2":
        return EtherscanV2Fetcher(config)
    elif config.api_type == "blockscout_v2":
        return BlockscoutV2Fetcher(config)
    elif config.api_type == "sourcify":
        return SourcifyFetcher(config)
    else:
        raise ValueError(f"Unknown API type: {config.api_type}")

__all__ = [
    "BaseFetcher",
    "EtherscanV2Fetcher",
    "BlockscoutV2Fetcher",
    "SourcifyFetcher",
    "create_fetcher",
]
