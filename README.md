# euler-verifier

Bytecode-level verification of deployed Euler protocol contracts.

For every allowlisted contract on every supported chain, the engine proves
that the on-chain runtime bytecode is exactly what a commit-pinned local
build produces — block explorers are never in the trust path — and then
diffs each deployment against its component's audited baseline so any code
beyond audited revisions is visible as a real diff.

The verified inputs and generated per-chain reports live in
[euler-interfaces `verify/`](https://github.com/euler-xyz/euler-interfaces/tree/master/verify):
`manifest.json` (SHA-only provenance pins), `audits.json` (audit registry),
`baselines.json` (component audit baselines), and one report per chain ID.

## Method

1. `eth_getCode` for the address (public endpoints from `networks.json`,
   tried in order; `DEPLOYMENT_RPC_URL_<chainId>` optionally overrides).
2. Check out `repo@commit`, apply the recorded build profile (and submodule
   overrides, if any), `forge build`.
3. Strip trailing CBOR metadata from both artifact and chain code, mask
   `immutableReferences`, zero embedded child-artifact metadata digests.
4. Byte-equality proves the pin; the sha256 of the stripped code is recorded
   as evidence.

Contracts reachable only through another contract's immutables (the EVault
modules, the EulerSwap V2 management implementation) are unpacked via their
public getters, cross-checked against the immutable words embedded in the
parent's on-chain code, and proven from the same pin.

## Usage

```bash
pnpm install

# Verify manifest entries against live chains
pnpm verify --manifest <verify/manifest.json> --addresses <euler-interfaces>/addresses [--chain 1] [--no-explorer]

# Validators (used as the CI gate on euler-interfaces PRs)
pnpm tsx src/validate-manifests.ts --manifest <manifest.json> --audits <audits.json>
pnpm tsx src/check-completeness.ts --manifest <manifest.json> --addresses <addresses>

# Component-baseline diffs and report rendering
pnpm tsx src/run-baselines.ts --manifest <manifest.json> --baselines <baselines.json> --out <dir>
pnpm tsx src/render-report.ts --manifest <manifest.json> --outcomes <outcomes.json> --baselines <baselines.json> --diffs <dir>/component-diffs.json --out <verify/>

# Unpacked-implementation verification
pnpm tsx src/verify-modules.ts --manifest <manifest.json> --addresses <addresses> --out <dir>
pnpm tsx src/verify-swap-management.ts --manifest <manifest.json> --addresses <addresses> --out <dir>

pnpm test              # unit suite
pnpm test:integration  # clones + builds a pinned repo and proves EVC on public RPCs
```

Requirements: node + pnpm (version pinned in `package.json`), `git`, `forge`.
No secrets are required; see `.env.example` for the optional RPC override.

Operational procedures (adding a chain or contract, endpoint rotation,
re-verification) are in [RUNBOOK.md](RUNBOOK.md).
