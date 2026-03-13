"""
Explorer auto-detection for unknown chain IDs.

Probes explorer APIs to determine which one works for a given chain,
enabling verification of networks not yet configured in networks.json.
"""

import os
from pathlib import Path
from typing import Optional

import requests

from .config import NetworkConfig, ROOT_DIR


def _load_api_key() -> str:
    """Load Etherscan API key from environment or .env file."""
    api_key = os.getenv("ETHERSCAN_API_KEY", "")
    if api_key:
        return api_key

    env_file = ROOT_DIR / ".env"
    if env_file.exists():
        try:
            for line in env_file.read_text().splitlines():
                if line.startswith("ETHERSCAN_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"\'')
        except Exception:
            pass

    return ""


def _try_etherscan_v2(chain_id: int) -> Optional[NetworkConfig]:
    """Try Etherscan V2 unified API for this chain ID."""
    api_key = _load_api_key()

    # Use the getchainlist endpoint to check if the chain is supported
    url = (
        f"https://api.etherscan.io/v2/api"
        f"?chainid={chain_id}&module=contract&action=getcontractcreation"
        f"&contractaddresses=0x0000000000000000000000000000000000000001"
        f"&apikey={api_key}"
    )

    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        # If the API recognizes the chain, it won't return "NOTOK" with chain error
        # A valid chain returns status "1" or "0" (no result), but NOT an error about chain
        message = data.get("message", "")
        result = data.get("result", "")

        # Etherscan returns specific error for unsupported chains
        if isinstance(result, str) and "chain" in result.lower() and "not supported" in result.lower():
            return None

        # If we got here without a chain error, the chain is supported
        return NetworkConfig(
            chain_id=chain_id,
            name=f"Chain {chain_id}",
            status="discovered",
            explorer_url=f"https://etherscan.io",  # Generic, will be overridden if known
            explorer_api="https://api.etherscan.io/v2/api",
            api_type="etherscan_v2",
            key=str(chain_id),
        )

    except (requests.RequestException, ValueError, KeyError):
        return None


def _try_sourcify(chain_id: int) -> Optional[NetworkConfig]:
    """Try Sourcify API as a universal fallback."""
    url = f"https://sourcify.dev/server/chains/{chain_id}"

    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            name = data.get("name", f"Chain {chain_id}")
            return NetworkConfig(
                chain_id=chain_id,
                name=name,
                status="discovered",
                explorer_url="",
                explorer_api="https://sourcify.dev/server",
                api_type="sourcify",
                key=str(chain_id),
            )
    except (requests.RequestException, ValueError, KeyError):
        pass

    return None


def discover_network(chain_id: int) -> Optional[NetworkConfig]:
    """
    Auto-detect which explorer API works for a given chain ID.

    Tries in order:
    1. Etherscan V2 unified API (covers ~80% of EVM chains)
    2. Sourcify (universal fallback)

    Returns a synthetic NetworkConfig or None if no explorer found.
    """
    # Try Etherscan V2 first
    config = _try_etherscan_v2(chain_id)
    if config:
        return config

    # Fall back to Sourcify
    config = _try_sourcify(chain_id)
    if config:
        return config

    return None


def discover_unknown_chains() -> list[int]:
    """
    Scan euler-interfaces/addresses/ for chain IDs not in networks.json.

    Returns list of unknown chain IDs found.
    """
    from .config import load_networks

    known_chains = {c.chain_id for c in load_networks().values()}

    addresses_dir = ROOT_DIR / "euler-interfaces" / "addresses"
    if not addresses_dir.exists():
        return []

    unknown = []
    for entry in sorted(addresses_dir.iterdir()):
        if entry.is_dir():
            try:
                chain_id = int(entry.name)
                if chain_id not in known_chains:
                    unknown.append(chain_id)
            except ValueError:
                continue

    return unknown
