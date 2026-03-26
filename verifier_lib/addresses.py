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


ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

# Maps each address JSON file to the set of contract names we can verify from it
_ADDRESS_FILES = [
    ("CoreAddresses.json", VERIFIABLE_CORE),
    ("PeripheryAddresses.json", VERIFIABLE_PERIPHERY),
    ("EulerSwapAddresses.json", VERIFIABLE_SWAP),
    ("TokenAddresses.json", VERIFIABLE_TOKEN),
    ("BridgeAddresses.json", VERIFIABLE_BRIDGE),
]


def load_contracts(chain_id: int) -> Dict[str, str]:
    """Load verifiable contracts from euler-interfaces/addresses/{chain_id}/.

    Returns a dict of contract_name -> address, ordered by gold standard.
    Only includes contracts that exist for this chain and have non-zero addresses.
    """
    base = ROOT_DIR / "euler-interfaces" / "addresses" / str(chain_id)
    contracts: Dict[str, str] = {}

    for filename, verifiable_set in _ADDRESS_FILES:
        addr_file = base / filename
        if not addr_file.exists():
            continue
        try:
            data = json.loads(addr_file.read_text())
            for name, address in data.items():
                if name in verifiable_set and address and address != ZERO_ADDRESS:
                    contracts[name] = address
        except (json.JSONDecodeError, IOError):
            pass

    # Return in gold standard order, then any extras
    ordered = {name: contracts[name] for name in GOLD_STANDARD_ORDER if name in contracts}
    for name, address in contracts.items():
        if name not in ordered:
            ordered[name] = address

    return ordered


def get_missing_contracts(chain_id: int) -> Set[str]:
    """Get contracts from gold standard that are missing on this chain."""
    available = set(load_contracts(chain_id).keys())
    return set(GOLD_STANDARD_ORDER) - available
