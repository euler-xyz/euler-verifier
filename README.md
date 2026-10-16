# euler-verifier

Bytecode-level verification of deployed Euler protocol contracts.

For every allowlisted contract on every supported chain, the engine proves
that the on-chain runtime bytecode is exactly what a commit-pinned local
build produces — block explorers are never in the trust path — and then
diffs each deployment against its component's audited baseline so any code
beyond audited revisions is visible as a real diff.

**What a proof claims.** A MATCH shows runtime correspondence under explicit
normalization and trust assumptions: the deployed runtime code equals the
pinned build once the metadata trailer is stripped and immutables and
build-located embedded metadata digests are masked. It does not prove
initialization, governance, immutable configuration or deployment safety.

The verified inputs and generated per-chain reports live in
[euler-interfaces `verify/`](https://github.com/euler-xyz/euler-interfaces/tree/master/verify):
`manifest.json` (SHA-only provenance pins), `audits.json` (audit registry),
`baselines.json` (component audit baselines), and one report per chain ID.
The chains themselves come from euler-interfaces `EulerChains.json`.

## Method

1. Resolve the address consumers receive: `addresses/<chainId>/` with the
   `config/addresses/<chainId>/` overlay applied, exactly as euler-interfaces
   `chains.js` merges them into `EulerChains.json`, which must be current.
   Manifest address overrides are rejected.
2. `eth_getCode` for the address, trying `DEPLOYMENT_RPC_URL_<chainId>` first
   if set, then viem's default public endpoints for the chain. The viem chain
   is the one `EulerChains.json` names (`viemName`, else the only viem chain
   with that id). A declared proxy must still delegate to the declared
   implementation (EIP-1967 slot), whose code is then proven.
3. Check out `repo@commit` in an engine-managed clone with the repo's GitHub
   origin, reset hard and cleaned of untracked files (submodules too), apply
   the recorded build profile and submodule pins (full 40-hex SHAs only),
   `forge build --ast`.
4. Normalize both codes: strip the metadata trailer if it validates as
   Solidity CBOR, mask `immutableReferences`, and mask the metadata digests of
   embedded child contracts. Children are the contracts the compiler lists in
   the AST's `contractDependencies`, recursively; a child's digest is masked
   only where its code occurs exactly once in the creation code of the
   contract embedding it, and only if its bytes change when the same commit
   is built again with just `useLiteralContent` flipped. That second build
   changes every digest the compiler places and no other byte, so a constant
   equal to a child's code, or a child the compiler listed but never placed,
   stays compared. A second copy (a constant equal to the child's code, or the
   child embedded by both constructor and runtime) leaves it unmasked too.
5. Byte-equality proves the pin; the sha256 of the normalized code is
   recorded as evidence.

Code reachable only through a verified implementation (the eight EVault
modules, the EulerSwap V2 management contract) is unpacked via public
getters, cross-checked against the immutable words embedded in the
implementation's on-chain code, and proven from the same pin. `pnpm verify`
does this for every implementation that matches, so the CI gate covers it.

## Usage

```bash
pnpm install
```

### Add manifest entries and reports

`pnpm add-entries` writes the `verify/manifest.json` entries euler-interfaces
is missing and renders the reports. Nobody edits the manifest by hand. It
handles every allowlisted contract that has no entry, or whose entry was
proven at another address (a redeploy): a new chain, or one new or
redeployed contract on an existing chain. Each entry records the address it
was proven at in `evidence.address`.

1. Deploy, and let the deployment write `addresses/<chainId>/` into your
   euler-interfaces checkout. Run `node chains.js` there so `EulerChains.json`
   carries the new addresses (a new chain also needs its `chains.js` entry;
   euler-interfaces README, "Adding a chain").
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

Each missing or redeployed contract is proven against candidate pins, and
the first that proves is written:

- `--candidates-from <checkout>`: the checkout's HEAD commit and the commits
  its GitHub submodules point at (EVC, EVK, reward-streams, euler-earn,
  euler-swap, …). They are built with the checkout's foundry profile, then
  each submodule's own, then every profile the manifest uses for that
  contract. Repeatable.
- `--candidate <repo>@<sha>`: any other commit, e.g.
  `euler-xyz/euler-earn@<sha>` (owner defaults to `euler-xyz`). It is built
  with the repo's own profile and every profile the manifest uses for that
  contract. Repeatable.
- For a redeploy, the entry's own pin next.
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
`verify/README.md`; they are the same bytes a full render produces. A chain
renders only when every entry proves with the same guards as `pnpm verify`
(canonical addresses, proxy slots) and its EVault modules and EulerSwap
management contract prove too; otherwise nothing is written for it and the
command exits 1. Entries recorded before `evidence.address` existed are
re-proven at their current address once and stamped.

### Verify

```bash
# Prove manifest entries against live chains; EulerChains.json is read from beside --addresses
pnpm verify --manifest <euler-interfaces>/verify/manifest.json --addresses <euler-interfaces>/addresses \
  [--chains <EulerChains.json>] [--chain 1] [--contract <key>] [--no-explorer]

# Validators (used as the CI gate on euler-interfaces PRs)
pnpm tsx src/validate-manifests.ts --manifest <manifest.json> --audits <audits.json> --baselines <baselines.json>
pnpm tsx src/check-completeness.ts --manifest <manifest.json> --addresses <addresses>
```

`pnpm verify` also proves the delegated code of every matching
implementation. `validate-manifests` rejects address overrides and any pin
that is not a full 40-hex SHA (manifest commits, submodule pins, baselines).
`check-completeness` fails on contracts without an entry, entries proven at
another address and an `EulerChains.json` that lags the address files, and
prints the `pnpm add-entries` command to run.

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

The chains and their explorers come from euler-interfaces `EulerChains.json`.
Each chain's name (the report title) and RPC endpoints come from the viem chain
it resolves to. If viem's default endpoint for a chain is unusable, set
`DEPLOYMENT_RPC_URL_<chainId>` for a local run, or bump viem once a release
fixes it. The explorer cross-check follows each chain's `verifier`: Etherscan V2 for
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
No secrets are required; see `.env.example` for the optional RPC variables.

Operational procedures (adding a chain or contract, endpoint rotation,
re-verification) are in [RUNBOOK.md](RUNBOOK.md).
