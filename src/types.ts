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

export interface SubmoduleOverride {
  /** Repo-relative submodule path, e.g. "lib/openzeppelin-contracts". */
  path: string
  /** Commit or tag checked out in that submodule. */
  ref: string
}

export interface ProxyDeclaration {
  /** The proxy address listed in euler-interfaces addresses/. */
  address: string
  /** The implementation the pin is proven against; must equal the proxy's EIP-1967 implementation slot. */
  implementation: string
  type?: string
  note?: string
}

export interface BytecodeEntry {
  /** GitHub slug, e.g. "euler-xyz/ethereum-vault-connector". */
  repo: string
  /** Full 40-hex commit SHA. Branch or tag pins are rejected. */
  commit: string
  /** Solidity contract (artifact) name, e.g. "EthereumVaultConnector". */
  contractName: string
  profile: CompileProfile
  verified?: 'bytecode'
  waiver?: Waiver | null
  /** Deployments built with submodules moved off their gitlinks record the refs here; the build must reproduce them. */
  evidence?: { codeSize?: number; origin?: string; strippedSha256?: string; submoduleOverrides?: SubmoduleOverride[] }
  proxy?: ProxyDeclaration
  /**
   * Test/override only: explicit address. In production runs addresses come
   * from euler-interfaces/addresses/<chainId>/ and this field must be absent.
   */
  address?: string
}

/** Long-established contract documented by a provenance note instead of a bytecode proof (see CANONICAL_EXCEPTIONS). */
export interface CanonicalEntry {
  repo: string
  verified: 'canonical'
  note: string
  address?: string
}

export type ManifestEntry = BytecodeEntry | CanonicalEntry

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
  /** [chain, artifact] counts of embedded child-metadata digests zeroed before comparison. */
  embeddedDigestsMasked?: [number, number]
  /** Byte offset of the first difference in masked+stripped runtime, when sizes match but content differs. */
  firstDivergence?: number | null
}

export type VerdictKind = 'MATCH' | 'MISMATCH' | 'WAIVED' | 'CANONICAL' | 'ERROR'

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
  commit?: string
  contractName?: string
  /** For a declared proxy: the implementation whose code was compared. */
  implementation?: string
  evidence?: CompareEvidence
  waiver?: Waiver
  note?: string
  error?: string
  /** Secondary, untrusted signal. Never affects the verdict. */
  explorer?: ExplorerCrossCheck
  rpcUrl?: string
  artifactPath?: string
}

/** An explorer as euler-interfaces EulerChains.json declares it for contract verification. */
export interface ExplorerVerifier {
  type: 'etherscan' | 'blockscout' | 'sourcify' | 'custom'
  url?: string
}

export interface NetworkInfo {
  name: string
  chainId: number
  explorerUrl: string
  verifier?: ExplorerVerifier
  /** networks.json override if set, else viem's default endpoints; env DEPLOYMENT_RPC_URL_<chainId> takes precedence. */
  rpc: string[]
  /** Why viem supplied no endpoints, when it couldn't resolve the chain. */
  viemProblem?: string
}
