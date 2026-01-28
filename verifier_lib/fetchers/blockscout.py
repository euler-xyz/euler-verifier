"""
Blockscout V2 API fetcher.
"""

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional

import requests

from .base import BaseFetcher
from ..config import NetworkConfig, ROOT_DIR


class BlockscoutV2Fetcher(BaseFetcher):
    """Fetcher for Blockscout V2 API."""
    
    def __init__(self, config: NetworkConfig):
        self.config = config
        self.cache_dir = ROOT_DIR / "cache" / "blockscout" / str(config.chain_id)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get_verified_source(self, address: str) -> Optional[Dict[str, Any]]:
        """Fetch verified source from Blockscout V2 API."""
        cache_file = self.cache_dir / f"{address.lower()}.json"
        
        # Check cache first
        if cache_file.exists():
            try:
                with open(cache_file) as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        
        print(f"    Fetching from {self.config.name} explorer...", flush=True)
        
        # Blockscout V2 endpoint
        url = f"{self.config.explorer_api}/v2/smart-contracts/{address}"
        
        try:
            response = requests.get(url, timeout=30)
            
            if response.status_code != 200:
                print(f"    API returned status {response.status_code}", flush=True)
                return None
            
            data = response.json()
            
            if not data.get("source_code") and not data.get("additional_sources"):
                print(f"    Contract not verified", flush=True)
                return None
            
            # Parse sources from Blockscout v2 format
            sources = {}
            
            # Main source file
            if data.get("source_code"):
                main_name = data.get("file_path") or data.get("name") or "main.sol"
                sources[main_name] = {"content": data["source_code"]}
            
            # Additional source files
            for src in data.get("additional_sources", []):
                file_path = src.get("file_path", "unknown.sol")
                sources[file_path] = {"content": src.get("source_code", "")}
            
            source_data = {
                "address": address,
                "contractName": data.get("name", "Unknown"),
                "compilerVersion": data.get("compiler_version", ""),
                "runs": data.get("optimization_runs", 200),
                "sources": sources,
            }
            
            # Cache result
            with open(cache_file, "w") as f:
                json.dump(source_data, f, indent=2)
            
            return source_data
            
        except requests.RequestException as e:
            print(f"    Network error: {e}", flush=True)
            return None
        except Exception as e:
            print(f"    Error: {e}", flush=True)
            return None
    
    def get_source_hash(self, address: str) -> Optional[str]:
        """Get hash of source code for cache validation."""
        source_data = self.get_verified_source(address)
        if not source_data:
            return None
        
        # Hash all source content
        hasher = hashlib.sha256()
        for filepath in sorted(source_data.get("sources", {}).keys()):
            content = source_data["sources"][filepath].get("content", "")
            hasher.update(filepath.encode())
            hasher.update(content.encode())
        
        return hasher.hexdigest()[:16]
