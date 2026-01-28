"""
Cache for verified commit matches.
"""

import json
from pathlib import Path
from typing import Dict, Optional

from .config import ROOT_DIR


class CommitMatchCache:
    """
    Cache verified commit matches to avoid re-searching.
    
    Stores:
    - chain_id:address -> commit hash
    - source_hash for validation (skip re-verification if unchanged)
    """
    
    def __init__(self, cache_file: Optional[Path] = None):
        self.cache_file = cache_file or ROOT_DIR / "cache" / "verified_commits.json"
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        self._cache: Dict[str, Dict] = self._load()
    
    def _load(self) -> Dict[str, Dict]:
        """Load cache from disk."""
        if self.cache_file.exists():
            try:
                with open(self.cache_file) as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        return {}
    
    def _save(self):
        """Save cache to disk."""
        with open(self.cache_file, "w") as f:
            json.dump(self._cache, f, indent=2, sort_keys=True)
    
    def _key(self, chain_id: int, address: str) -> str:
        """Generate cache key."""
        return f"{chain_id}:{address.lower()}"
    
    def get(self, chain_id: int, address: str) -> Optional[str]:
        """
        Get cached commit for a contract.
        
        Returns commit hash if found, None otherwise.
        """
        key = self._key(chain_id, address)
        entry = self._cache.get(key)
        if entry:
            return entry.get("commit")
        return None
    
    def get_source_hash(self, chain_id: int, address: str) -> Optional[str]:
        """
        Get cached source hash for a contract.
        
        Returns source hash if found, None otherwise.
        """
        key = self._key(chain_id, address)
        entry = self._cache.get(key)
        if entry:
            return entry.get("source_hash")
        return None
    
    def set(self, chain_id: int, address: str, commit: str, source_hash: Optional[str] = None):
        """
        Cache a verified commit with optional source hash.
        
        Args:
            chain_id: Network chain ID
            address: Contract address
            commit: Verified commit hash
            source_hash: Hash of source code (for cache validation)
        """
        key = self._key(chain_id, address)
        self._cache[key] = {
            "commit": commit,
            "source_hash": source_hash,
        }
        self._save()
    
    def is_source_unchanged(self, chain_id: int, address: str, current_hash: str) -> bool:
        """
        Check if explorer source matches cached version.
        
        If True, we can skip re-verification and use cached commit.
        
        Args:
            chain_id: Network chain ID
            address: Contract address
            current_hash: Hash of current explorer source
        
        Returns:
            True if source is unchanged, False otherwise
        """
        cached_hash = self.get_source_hash(chain_id, address)
        if not cached_hash:
            return False
        return cached_hash == current_hash
    
    def clear(self, chain_id: Optional[int] = None):
        """
        Clear cache entries.
        
        Args:
            chain_id: If provided, only clear entries for this chain.
                     If None, clear all entries.
        """
        if chain_id is None:
            self._cache = {}
        else:
            prefix = f"{chain_id}:"
            self._cache = {k: v for k, v in self._cache.items() if not k.startswith(prefix)}
        self._save()
    
    def stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        chains: Dict[int, int] = {}
        for key in self._cache.keys():
            chain_id = int(key.split(":")[0])
            chains[chain_id] = chains.get(chain_id, 0) + 1
        
        return {
            "total_entries": len(self._cache),
            "chains": len(chains),
            "entries_per_chain": chains,
        }
