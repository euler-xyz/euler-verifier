"""
Etherscan V2 API fetcher.
"""

import hashlib
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

import requests

from .base import BaseFetcher
from ..config import NetworkConfig, ROOT_DIR


class EtherscanV2Fetcher(BaseFetcher):
    """Fetcher for Etherscan V2 unified API."""
    
    def __init__(self, config: NetworkConfig, api_key: Optional[str] = None):
        self.config = config
        self.api_key = api_key or os.getenv("ETHERSCAN_API_KEY", "")
        self.cache_dir = ROOT_DIR / "cache" / "etherscan" / str(config.chain_id)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get_verified_source(self, address: str) -> Optional[Dict[str, Any]]:
        """Fetch verified source from Etherscan V2 API."""
        cache_file = self.cache_dir / f"{address.lower()}.json"
        
        # Check cache first
        if cache_file.exists():
            try:
                with open(cache_file) as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass
        
        print(f"    Fetching from {self.config.name} explorer...", flush=True)
        
        # Build URL with chainid parameter
        url = f"{self.config.explorer_api}?chainid={self.config.chain_id}&module=contract&action=getsourcecode&address={address}&apikey={self.api_key}"
        
        try:
            response = requests.get(url, timeout=30)
            data = response.json()
            
            if data.get("status") != "1":
                print(f"    API error: {data.get('message', 'Unknown error')}", flush=True)
                return None
            
            result = data["result"][0]
            if not result.get("SourceCode"):
                print(f"    Contract not verified", flush=True)
                return None
            
            # Parse source code (can be JSON or plain text)
            source_code = result["SourceCode"]
            if source_code.startswith("{{"):
                # Double-braced JSON format
                source_code = source_code[1:-1]
                parsed = json.loads(source_code)
            elif source_code.startswith("{"):
                # Single-braced JSON format
                try:
                    parsed = json.loads(source_code)
                except json.JSONDecodeError:
                    parsed = {"sources": {result["ContractName"]: {"content": source_code}}}
            else:
                # Plain source code
                parsed = {"sources": {result["ContractName"]: {"content": source_code}}}
            
            source_data = {
                "address": address,
                "contractName": result["ContractName"],
                "compilerVersion": result["CompilerVersion"],
                "runs": int(result.get("Runs", 200)),
                "sources": parsed.get("sources", {}),
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
