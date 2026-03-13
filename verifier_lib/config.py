"""
Network configuration and loading.
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

ROOT_DIR = Path(__file__).parent.parent


@dataclass
class NetworkConfig:
    """Configuration for a network."""
    chain_id: int
    name: str
    status: str  # "production" | "testing"
    explorer_url: str
    explorer_api: str
    api_type: str  # "etherscan_v2" | "blockscout_v2"
    key: str = ""  # Dictionary key from networks.json (e.g., "mainnet", "arbitrum")
    
    @property
    def is_production(self) -> bool:
        return self.status == "production"
    
    @property
    def is_blockscout(self) -> bool:
        return self.api_type == "blockscout_v2"


def load_networks() -> Dict[str, NetworkConfig]:
    """Load all network configurations from networks.json."""
    networks_file = ROOT_DIR / "networks.json"
    
    with open(networks_file) as f:
        data = json.load(f)
    
    return {
        name: NetworkConfig(
            chain_id=config["chain_id"],
            name=config["name"],
            status=config["status"],
            explorer_url=config["explorer_url"],
            explorer_api=config["explorer_api"],
            api_type=config["api_type"],
            key=name,
        )
        for name, config in data.items()
    }


def get_network(name_or_chain_id) -> NetworkConfig:
    """Get a network config by name or chain ID."""
    networks = load_networks()
    
    # Try by name first
    if isinstance(name_or_chain_id, str) and name_or_chain_id in networks:
        return networks[name_or_chain_id]
    
    # Try by chain ID
    try:
        chain_id = int(name_or_chain_id)
        for config in networks.values():
            if config.chain_id == chain_id:
                return config
    except (ValueError, TypeError):
        pass
    
    raise ValueError(f"Unknown network: {name_or_chain_id}")


def list_networks(production_only: bool = False) -> Dict[str, NetworkConfig]:
    """List available networks, optionally filtered to production only."""
    networks = load_networks()
    
    if production_only:
        return {k: v for k, v in networks.items() if v.is_production}
    
    return networks
