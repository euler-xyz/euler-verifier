"""
Contract address loading from euler-interfaces.
"""

import json
from pathlib import Path
from typing import Dict, Set

from .config import ROOT_DIR

# Contracts we can verify from coreAddresses.json
VERIFIABLE_CORE: Set[str] = {
    "evc",
    "eVaultFactory", 
    "eVaultImplementation",
    "protocolConfig",
    "sequenceRegistry",
    "balanceTracker",
    "eulerEarnFactory",
}

# Contracts we can verify from peripheryAddresses.json
VERIFIABLE_PERIPHERY: Set[str] = {
    "adaptiveCurveIRMFactory",
    "fixedCyclicalBinaryIRMFactory",
    "kinkIRMFactory",
    "kinkyIRMFactory",
    "feeFlowController",
    "governorAccessControlEmergencyFactory",
    "oracleRouterFactory",
    "swapVerifier",
    "eulerEarnPublicAllocator",
}

# Contracts we can verify from EulerSwapAddresses.json
VERIFIABLE_SWAP: Set[str] = {
    "eulerSwapV1Factory",
    "eulerSwapV1Implementation",
    "eulerSwapV1Periphery",
    "eulerSwapV2Factory",
    "eulerSwapV2Implementation",
    "eulerSwapV2Periphery",
    "eulerSwapV2ProtocolFeeConfig",
    "eulerSwapV2Registry",
}

# Contracts we can verify from TokenAddresses.json
VERIFIABLE_TOKEN: Set[str] = {
    "rEUL",
}

# Contracts we can verify from BridgeAddresses.json
VERIFIABLE_BRIDGE: Set[str] = {
    "eulOFTAdapter",
}

# All verifiable contracts
VERIFIABLE_CONTRACTS: Set[str] = VERIFIABLE_CORE | VERIFIABLE_PERIPHERY | VERIFIABLE_SWAP | VERIFIABLE_TOKEN | VERIFIABLE_BRIDGE

# Gold standard order (Ethereum mainnet has all contracts)
GOLD_STANDARD_ORDER = [
    # Core
    "evc",
    "eVaultFactory",
    "eVaultImplementation",
    "protocolConfig",
    "sequenceRegistry",
    "balanceTracker",
    # Euler Earn
    "eulerEarnFactory",
    # EulerSwap V1
    "eulerSwapV1Factory",
    "eulerSwapV1Implementation",
    "eulerSwapV1Periphery",
    # EulerSwap V2
    "eulerSwapV2Factory",
    "eulerSwapV2Implementation",
    "eulerSwapV2Periphery",
    "eulerSwapV2ProtocolFeeConfig",
    "eulerSwapV2Registry",
    # IRM Factories
    "adaptiveCurveIRMFactory",
    "fixedCyclicalBinaryIRMFactory",
    "kinkIRMFactory",
    "kinkyIRMFactory",
    # Other Periphery
    "eulerEarnPublicAllocator",
    "feeFlowController",
    "governorAccessControlEmergencyFactory",
    "oracleRouterFactory",
    "swapVerifier",
    # Tokens
    "rEUL",
    # Bridge
    "eulOFTAdapter",
]


def load_contracts(chain_id: int) -> Dict[str, str]:
    """
    Load verifiable contracts from euler-interfaces/addresses/{chain_id}/.
    
    Returns a dict of contract_name -> address, ordered by gold standard.
    Only includes contracts that exist for this chain.
    """
    base = ROOT_DIR / "euler-interfaces" / "addresses" / str(chain_id)
    contracts: Dict[str, str] = {}
    
    # Load core addresses
    core_file = base / "coreAddresses.json"
    if core_file.exists():
        try:
            core = json.loads(core_file.read_text())
            for name, address in core.items():
                if name in VERIFIABLE_CORE and address and address != "0x0000000000000000000000000000000000000000":
                    contracts[name] = address
        except (json.JSONDecodeError, IOError):
            pass
    
    # Load periphery addresses
    periphery_file = base / "peripheryAddresses.json"
    if periphery_file.exists():
        try:
            periphery = json.loads(periphery_file.read_text())
            for name, address in periphery.items():
                if name in VERIFIABLE_PERIPHERY and address and address != "0x0000000000000000000000000000000000000000":
                    contracts[name] = address
        except (json.JSONDecodeError, IOError):
            pass
    
    # Load EulerSwap addresses
    swap_file = base / "EulerSwapAddresses.json"
    if swap_file.exists():
        try:
            swap = json.loads(swap_file.read_text())
            for name, address in swap.items():
                if name in VERIFIABLE_SWAP and address and address != "0x0000000000000000000000000000000000000000":
                    contracts[name] = address
        except (json.JSONDecodeError, IOError):
            pass
    
    # Load Token addresses (rEUL)
    token_file = base / "TokenAddresses.json"
    if token_file.exists():
        try:
            tokens = json.loads(token_file.read_text())
            for name, address in tokens.items():
                if name in VERIFIABLE_TOKEN and address and address != "0x0000000000000000000000000000000000000000":
                    contracts[name] = address
        except (json.JSONDecodeError, IOError):
            pass
    
    # Load Bridge addresses (eulOFTAdapter)
    bridge_file = base / "BridgeAddresses.json"
    if bridge_file.exists():
        try:
            bridge = json.loads(bridge_file.read_text())
            for name, address in bridge.items():
                if name in VERIFIABLE_BRIDGE and address and address != "0x0000000000000000000000000000000000000000":
                    contracts[name] = address
        except (json.JSONDecodeError, IOError):
            pass
    
    # Return in gold standard order
    ordered = {}
    for name in GOLD_STANDARD_ORDER:
        if name in contracts:
            ordered[name] = contracts[name]
    
    # Add any remaining contracts not in gold standard
    for name, address in contracts.items():
        if name not in ordered:
            ordered[name] = address
    
    return ordered


def get_missing_contracts(chain_id: int) -> Set[str]:
    """Get contracts from gold standard that are missing on this chain."""
    available = set(load_contracts(chain_id).keys())
    return set(GOLD_STANDARD_ORDER) - available
