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
The chains themselves come from euler-interfaces `EulerChains.json`.

## Method

1. `eth_getCode` for the address, trying in order `DEPLOYMENT_RPC_URL_<chainId>`
   if set, then the chain's `rpc` override in `networks.json` if it has one,
   else viem's default public endpoints for the chain. The viem chain is the
   one euler-interfaces `EulerChains.json` names (`viemName`, else the only
   viem chain with that id).
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
```

### Add manifest entries and reports

`pnpm add-entries` writes the `verify/manifest.json` entries euler-interfaces
is missing and renders the reports. Nobody edits the manifest by hand. It
handles every allowlisted contract under `addresses/<chainId>/` that has no
entry: a new chain, or one new or redeployed contract on an existing chain.

1. Deploy, and let the deployment write `addresses/<chainId>/` into your
   euler-interfaces checkout. A new chain also needs its `chains.js` entry and
   a regenerated `EulerChains.json` (euler-interfaces README, "Adding a chain").
2. Push the deployed commits. The engine clones them from GitHub.
3. From this repo, with `forge` on PATH (CI uses 1.7.1):

   ```bash
   # a new chain, deployed from evk-periphery
   pnpm add-entries --interfaces ../euler-interfaces --chain 12345 \
     --candidates-from ../evk-periphery

   # one redeployed contract, e.g. a new swapVerifier on Base
   pnpm add-entries --interfaces ../euler-interfaces --chain 8453 \
     --candidate euler-xyz/evk-periphery@<40-hex sha>
   ```

4. Review and commit the changed `verify/manifest.json`, `verify/<chainId>.md`
   and `verify/README.md` in the same euler-interfaces PR as the addresses.

Each missing contract is proven against candidate pins, and the first that
proves is written:

- `--candidates-from <checkout>`: the checkout's HEAD commit and the commits
  its GitHub submodules point at (EVC, EVK, reward-streams, euler-earn,
  euler-swap, …). They are built with the checkout's foundry profile, then
  each submodule's own, then every profile the manifest uses for that
  contract. Repeatable.
- `--candidate <repo>@<sha>`: any other commit, e.g.
  `euler-xyz/euler-earn@<sha>` (owner defaults to `euler-xyz`). It is built
  with the repo's own profile and every profile the manifest uses for that
  contract. Repeatable.
- Then the pins other chains use for the same contract, with their profiles,
  declared submodule pins and proxy declarations. A pin this chain already
  uses for another contract comes first, then the most used.

A contract no candidate proves is listed with every candidate tried and why
it failed, and nothing is written for it; the command then exits 1. The
written `evidence.origin` says where the proven pin came from:
`candidates-from:<repo>@<sha>`, `candidate`, or `manifest:<chainId>`.

| Option | Meaning |
|--------|---------|
| `--interfaces <dir>` | euler-interfaces checkout. Required. |
| `--chain <id>` | Only this chain. Repeatable. Default: every chain under `addresses/`. |
| `--candidates-from <dir>` | A deploying checkout whose HEAD and submodule commits are candidates. Repeatable. |
| `--candidate <repo>@<sha>` | Another candidate commit. Repeatable. |
| `--render` | Also render the selected chains that miss nothing. Without `--chain`, a full render of every report and `verify/README.md`. |
| `--repos-dir <dir>` | Source checkouts (default `repos/engine`). |
| `--cache-dir <dir>` | Build cache (default `repos/build-cache`). |
| `--engine-ref <label>` | Report footer label (default `master`). |

Only the reports of the chains it touched change, and only their rows in
`verify/README.md`; they are the same bytes a full render produces.

### Verify

```bash
# Prove manifest entries against live chains; EulerChains.json is read from beside --addresses
pnpm verify --manifest <euler-interfaces>/verify/manifest.json --addresses <euler-interfaces>/addresses \
  [--chains <EulerChains.json>] [--chain 1] [--contract <key>] [--no-explorer]

# Validators (used as the CI gate on euler-interfaces PRs)
pnpm tsx src/validate-manifests.ts --manifest <manifest.json> --audits <audits.json>
pnpm tsx src/check-completeness.ts --manifest <manifest.json> --addresses <addresses>
```

When contracts lack entries, `check-completeness` prints the `pnpm add-entries`
command to run.

### Individual steps

`add-entries` runs these for the chains it renders. They remain available on
their own:

```bash
# Proving sweep over a tasks file (chain/key/address + ordered candidates)
pnpm tsx src/build-manifest.ts --tasks <tasks.json> --chains <EulerChains.json> --out <dir>

# Unpacked-implementation verification
pnpm tsx src/verify-modules.ts --manifest <dir>/manifest.proven.json --addresses <addresses> --out <dir>
pnpm tsx src/verify-swap-management.ts --manifest <dir>/manifest.proven.json --addresses <addresses> --out <dir>

# Component-baseline diffs and report rendering
pnpm tsx src/run-baselines.ts --manifest <manifest.json> --baselines <baselines.json> --out <dir>
pnpm tsx src/render-report.ts --manifest <manifest.json> --outcomes <dir>/outcomes.json --baselines <baselines.json> \
  --diffs <dir>/component-diffs.json --modules <dir>/modules.json --swap-management <dir>/swap-management.json \
  --audits <audits.json> --notes manifests/attention-notes.json --chains <EulerChains.json> --out <verify/> [--chain <id>]...
```

`verify-modules` and `verify-swap-management` also take `--chains`, defaulting
to the `EulerChains.json` beside `--addresses`.

### Networks

Chains, names and explorers come from euler-interfaces `EulerChains.json`, and
RPC endpoints from viem. `networks.json` holds optional overrides by chain:
`name` (the report title) and `rpc` (replaces viem's endpoints). Add an `rpc`
override only when viem's default endpoint for a chain is unusable. The
explorer cross-check follows each chain's `verifier`: Etherscan V2 for
`etherscan` (with `ETHERSCAN_API_KEY`), the Etherscan-compatible API at the url
for `blockscout` and `custom`, and the Sourcify v2 API at the url (default
sourcify.dev) for `sourcify`. It is informational and never decides a verdict.

### Tests

```bash
pnpm test              # unit suite
pnpm test:integration  # clones + builds a pinned repo and proves EVC on public RPCs
```

Requirements: node + pnpm (version pinned in `package.json`), `git`, `forge` 1.7.1 (pinned in CI; other
versions change the metadata hash, which breaks the integration tests' byte-for-byte fixture check).
No secrets are required; see `.env.example` for the optional overrides.

Operational procedures (adding a chain or contract, endpoint rotation,
re-verification) are in [RUNBOOK.md](RUNBOOK.md).
