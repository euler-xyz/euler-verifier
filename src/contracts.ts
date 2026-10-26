import type { CompileProfile } from './types.js'

/**
 * The verification allowlist (decision D1): manifest key -> where the source
 * lives and which Solidity contract (artifact) it is. `contractNames` are
 * candidates tried in order — a few keys map to different contracts per chain
 * (e.g. eulOFTAdapter lockbox vs mint/burn variants).
 */
export interface ContractSpec {
  contractNames: string[]
  defaultRepo: string
  /** euler-swap nests EVK/OZ; its builds need recursive submodule init. */
  recursiveSubmodules?: boolean
  /** Builds the deploy script makes for this contract instead of the repo's profile; offered commits try them first. */
  deployProfiles?: CompileProfile[]
}

export const CONTRACT_SPECS: Record<string, ContractSpec> = {
  evc: { contractNames: ['EthereumVaultConnector'], defaultRepo: 'euler-xyz/ethereum-vault-connector' },
  eVaultFactory: { contractNames: ['GenericFactory'], defaultRepo: 'euler-xyz/euler-vault-kit' },
  eVaultImplementation: { contractNames: ['EVault'], defaultRepo: 'euler-xyz/euler-vault-kit' },
  protocolConfig: { contractNames: ['ProtocolConfig'], defaultRepo: 'euler-xyz/euler-vault-kit' },
  sequenceRegistry: { contractNames: ['SequenceRegistry'], defaultRepo: 'euler-xyz/euler-vault-kit' },
  balanceTracker: { contractNames: ['TrackingRewardStreams'], defaultRepo: 'euler-xyz/reward-streams' },

  eulerEarnFactory: { contractNames: ['EulerEarnFactory'], defaultRepo: 'euler-xyz/euler-earn' },
  eulerEarnPublicAllocator: { contractNames: ['PublicAllocator'], defaultRepo: 'euler-xyz/euler-earn' },

  eulerSwapV1Factory: { contractNames: ['EulerSwapFactory'], defaultRepo: 'euler-xyz/euler-swap', recursiveSubmodules: true },
  eulerSwapV1Implementation: { contractNames: ['EulerSwap'], defaultRepo: 'euler-xyz/euler-swap', recursiveSubmodules: true },
  eulerSwapV1Periphery: { contractNames: ['EulerSwapPeriphery'], defaultRepo: 'euler-xyz/euler-swap', recursiveSubmodules: true },
  eulerSwapV2Factory: { contractNames: ['EulerSwapFactory'], defaultRepo: 'euler-xyz/euler-swap', recursiveSubmodules: true },
  eulerSwapV2Implementation: { contractNames: ['EulerSwap'], defaultRepo: 'euler-xyz/euler-swap', recursiveSubmodules: true },
  eulerSwapV2Periphery: { contractNames: ['EulerSwapPeriphery'], defaultRepo: 'euler-xyz/euler-swap', recursiveSubmodules: true },
  eulerSwapV2ProtocolFeeConfig: { contractNames: ['EulerSwapProtocolFeeConfig'], defaultRepo: 'euler-xyz/euler-swap', recursiveSubmodules: true },
  eulerSwapV2Registry: { contractNames: ['EulerSwapRegistry'], defaultRepo: 'euler-xyz/euler-swap', recursiveSubmodules: true },

  // NOTE: the factory contract source lives in evk-periphery (src/EulerRouterFactory/),
  // not euler-price-oracle as the legacy mapping claimed.
  oracleRouterFactory: { contractNames: ['EulerRouterFactory'], defaultRepo: 'euler-xyz/evk-periphery' },
  swapVerifier: { contractNames: ['SwapVerifier'], defaultRepo: 'euler-xyz/evk-periphery' },
  // These factories embed the creation code of what they deploy, so a factory proof covers every suite or vault it made.
  // At evk-periphery's 20,000 runs they exceed the code size limit; interactiveDeployment.sh deploys 10,000-run builds.
  governorAccessControlEmergencyFactoryV2: {
    contractNames: ['GovernorAccessControlEmergencyFactoryV2'],
    defaultRepo: 'euler-xyz/evk-periphery',
    deployProfiles: [{ context: 'evk-periphery', solc: '0.8.24', optimizer_runs: 10000, evm_version: 'cancun' }],
  },
  securitizeFactory: {
    contractNames: ['ERC4626EVCCollateralSecuritizeFactory'],
    defaultRepo: 'euler-xyz/evk-periphery',
    deployProfiles: [{ context: 'evk-periphery', solc: '0.8.24', optimizer_runs: 10000, evm_version: 'cancun' }],
  },
  securitizeFactoryV2: {
    contractNames: ['ERC4626EVCCollateralSecuritizeFactoryV2'],
    defaultRepo: 'euler-xyz/evk-periphery',
    deployProfiles: [{ context: 'evk-periphery', solc: '0.8.24', optimizer_runs: 10000, evm_version: 'cancun' }],
  },

  rEUL: { contractNames: ['RewardToken'], defaultRepo: 'euler-xyz/evk-periphery' },
  eulOFTAdapter: {
    contractNames: ['MintBurnOFTAdapter', 'EulOFTAdapter', 'OFTAdapter'],
    defaultRepo: 'euler-xyz/evk-periphery',
  },
  // On mainnet EUL is the canonical 2021 token (euler-xyz/euler-governance) —
  // documented as a note, not bytecode-proven here. Everywhere else it is a
  // bridged ERC20BurnableMintable deployment from evk-periphery.
  EUL: { contractNames: ['ERC20BurnableMintable'], defaultRepo: 'euler-xyz/evk-periphery' },
}

/** Canonical addresses by manifest key and chain, documented instead of bytecode-proven. */
export const CANONICAL_EXCEPTIONS: Record<string, Record<number, string>> = {
  EUL: { 1: '0xd9Fcd98c322942075A5C3860693e9f4f03AAE07b' },
}
