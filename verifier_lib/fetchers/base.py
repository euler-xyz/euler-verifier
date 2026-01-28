"""
Base class for API fetchers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseFetcher(ABC):
    """Abstract base class for block explorer API fetchers."""
    
    @abstractmethod
    def get_verified_source(self, address: str) -> Optional[Dict[str, Any]]:
        """
        Fetch verified source code for a contract.
        
        Returns a dict with:
            - address: Contract address
            - contractName: Name of the contract
            - compilerVersion: Solidity compiler version
            - runs: Optimizer runs
            - sources: Dict of filepath -> {"content": source_code}
        
        Returns None if contract is not verified or on error.
        """
        pass
    
    @abstractmethod
    def get_source_hash(self, address: str) -> Optional[str]:
        """
        Get a hash of the source code for cache validation.
        
        Returns None if unable to compute hash.
        """
        pass
