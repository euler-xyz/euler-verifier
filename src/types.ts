export interface CompileProfile {
  /** Provenance: which repo's foundry profile these settings come from (e.g. "evk-periphery"). */
  context: string
  /** Exact solc version, e.g. "0.8.24". */
  solc: string
  optimizer_runs: number
  evm_version: string
}

export interface Waiver {
  reason: string
  signed_by: string
  date: string
}

export interface ManifestEntry {
  /** GitHub slug, e.g. "euler-xyz/ethereum-vault-connector". */
  repo: string
  /** Full 40-hex commit SHA. Branch or tag pins are rejected. */
  commit: string
  /** Solidity contract (artifact) name, e.g. "EthereumVaultConnector". */
  contractName: string
  profile: CompileProfile
  waiver?: Waiver | null
  /**
   * Test/override only: explicit address. In production runs addresses come
   * from euler-interfaces/addresses/<chainId>/ and this field must be absent.
   */
  address?: string
}

/** chainId (as string) -> manifest key (e.g. "evc") -> entry */
export type Manifest = Record<string, Record<string, ManifestEntry>>

export interface ImmutableRange {
  start: number
  length: number
}

export interface CborInfo {
  ipfs?: string
  solcVersion?: string
}

export interface CompareEvidence {
  chainCodeSize: number
  artifactCodeSize: number
  /** Executable size after the CBOR metadata trailer is stripped. */
  chainRuntimeSize?: number
  artifactRuntimeSize?: number
  maskedRanges: ImmutableRange[]
  strippedChainSha256?: string
  strippedArtifactSha256?: string
  chainCbor?: CborInfo
  artifactCbor?: CborInfo
  /** Byte offset of the first difference in masked+stripped runtime, when sizes match but content differs. */
  firstDivergence?: number | null
}

export type VerdictKind = 'MATCH' | 'MISMATCH' | 'WAIVED' | 'ERROR'

export interface ExplorerCrossCheck {
  status: 'verified' | 'unverified' | 'unavailable'
  contractName?: string
  compilerVersion?: string
  detail?: string
}

export interface VerificationRecord {
  chainId: number
  key: string
  address: string
  verdict: VerdictKind
  repo: string
  commit: string
  contractName: string
  evidence?: CompareEvidence
  waiver?: Waiver
  error?: string
  /** Secondary, untrusted signal. Never affects the verdict. */
  explorer?: ExplorerCrossCheck
  rpcUrl?: string
  artifactPath?: string
}

export interface NetworkInfo {
  key: string
  name: string
  chainId: number
  status: string
  explorerUrl: string
  explorerApi: string
  apiType: string
  /** Public default RPC endpoints; env DEPLOYMENT_RPC_URL_<chainId> takes precedence. */
  rpc: string[]
}
