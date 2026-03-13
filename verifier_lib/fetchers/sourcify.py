"""
Sourcify API fetcher.
"""

import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, Optional

import requests

from .base import BaseFetcher
from ..config import NetworkConfig, ROOT_DIR


class SourcifyFetcher(BaseFetcher):
    """Fetcher for Sourcify-compatible APIs (e.g. MonadVision via BlockVision)."""

    def __init__(self, config: NetworkConfig):
        self.config = config
        self.cache_dir = ROOT_DIR / "cache" / "sourcify" / str(config.chain_id)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_verified_source(self, address: str) -> Optional[Dict[str, Any]]:
        """Fetch verified source from Sourcify API."""
        cache_file = self.cache_dir / f"{address.lower()}.json"

        # Check cache first
        if cache_file.exists():
            try:
                with open(cache_file) as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                pass

        print(f"    Fetching from {self.config.name} explorer...", flush=True)

        # Sourcify files endpoint
        url = f"{self.config.explorer_api}/files/any/{self.config.chain_id}/{address}"

        try:
            response = requests.get(url, timeout=30)

            if response.status_code != 200:
                print(f"    Contract not verified", flush=True)
                return None

            data = response.json()

            if data.get("status") not in ("full", "partial"):
                print(f"    Contract not verified", flush=True)
                return None

            files = data.get("files", [])
            if not files:
                print(f"    No source files", flush=True)
                return None

            # Parse sources - strip the Sourcify path prefix to get clean paths
            # Path format: contracts/full_match/{chainId}/{address}/sources/{actual_path}
            sources = {}
            contract_name = "Unknown"
            compiler_version = ""

            prefix_pattern = re.compile(
                rf"contracts/(?:full|partial)_match/{self.config.chain_id}/{re.escape(address)}/sources/"
            )

            for f in files:
                file_path = f.get("path", "")
                content = f.get("content", "")
                name = f.get("name", "")

                # Skip metadata.json
                if name == "metadata.json":
                    # Extract compiler info and contract name from metadata
                    try:
                        metadata = json.loads(content)
                        compiler_version = metadata.get("compiler", {}).get("version", "")
                        # Get contract name from compilation target
                        target = metadata.get("settings", {}).get("compilationTarget", {})
                        if target:
                            contract_name = list(target.values())[0]
                    except (json.JSONDecodeError, IndexError):
                        pass
                    continue

                # Strip Sourcify path prefix
                clean_path = prefix_pattern.sub("", file_path)
                if clean_path == file_path:
                    # Try simpler strip if regex didn't match
                    parts = file_path.split("/sources/", 1)
                    clean_path = parts[1] if len(parts) > 1 else file_path

                sources[clean_path] = {"content": content}

            if not sources:
                print(f"    No source files", flush=True)
                return None

            source_data = {
                "address": address,
                "contractName": contract_name,
                "compilerVersion": compiler_version,
                "runs": 200,
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

        hasher = hashlib.sha256()
        for filepath in sorted(source_data.get("sources", {}).keys()):
            content = source_data["sources"][filepath].get("content", "")
            hasher.update(filepath.encode())
            hasher.update(content.encode())

        return hasher.hexdigest()[:16]
