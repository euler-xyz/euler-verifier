# euler-verifier Runbook

Operating procedures for the deployed-code verification system. The design
contract: **reports are a pure function of committed inputs** (addresses and
`EulerChains.json` in euler-interfaces, `verify/manifest.json`,
`verify/audits.json`, `verify/baselines.json`). Nothing runs on a schedule;
everything regenerates through PRs.

A MATCH is runtime correspondence under explicit normalization and trust
assumptions (metadata trailer stripped; immutables and build-located embedded
metadata digests masked). It is not a proof of initialization, governance,
immutable configuration or deployment safety; those need their own review.

## Add a deployment (the common case)

Done by whoever deploys, **in the same euler-interfaces PR that adds the
address** — the required check makes it impossible to forget. The manifest
entry and the report come from `pnpm add-entries`; nobody writes them by hand.

1. Deploy the contract. The deployment writes its address into your
   euler-interfaces checkout under `addresses/<chainId>/`. Run
   `node chains.js` there: the engine verifies the addresses consumers get
   (with `config/addresses/` applied) and refuses an `EulerChains.json` that
   lags the address files.
2. Push the commit you deployed from (the engine clones it from GitHub).
3. In this repo, generate the entry and the report. Name the deploying
   checkout, or the exact commit:

   ```bash
   pnpm add-entries --interfaces ../euler-interfaces --chain 8453 \
     --candidates-from ../evk-periphery
   # or
   pnpm add-entries --interfaces ../euler-interfaces --chain 8453 \
     --candidate euler-xyz/evk-periphery@<40-hex sha>
   ```

   It proves the bytecode, writes the entry into `verify/manifest.json` with
   the address it was proven at (`evidence.address`), and re-renders
   `verify/8453.md` and that chain's row in `verify/README.md`. A redeploy at
   a new address is detected by that field: the old entry is regenerated,
   trying its own pin after the commits you name.
4. Commit those files with the address change and open the PR. CI proves the
   changed chain again (or fails the PR).

If nothing proves, the command lists the contract with every candidate tried
and writes nothing for it. A proven entry is written only with its chain's
report: if the chain doesn't render, the entry is listed as `NOT WRITTEN` and
the next run proves it again. Wrong or unpushed commit, or a build profile none
of the candidates used: offer the right commit with `--candidate`, or use a
waiver (below) — never merge red. A forgotten or stale entry also fails CI:
`check-completeness` names the `pnpm add-entries` command to run. CI proves
every chain whose verification inputs the PR changes (address files,
`config/addresses`, the chain's manifest entries or `EulerChains.json` row),
and every chain when the verifier pin, workflow, baselines or audits change.

## Add a chain

1. euler-interfaces: add the chain to `chains.js` and run `node chains.js`
   (euler-interfaces README, "Adding a chain"). CI requires every chain to
   resolve to a viem chain. The engine reads the chain's explorer and verifier
   from `EulerChains.json`, and its name and RPC endpoints from viem. No
   euler-verifier change and no pin bump are needed.
2. Deploy. The deployment writes `addresses/<chainId>/` into your
   euler-interfaces checkout; run `node chains.js` again.
3. Generate every manifest entry and the chain's report:

   ```bash
   pnpm add-entries --interfaces ../euler-interfaces --chain <chainId> \
     --candidates-from ../evk-periphery
   ```

4. Open one euler-interfaces PR with the addresses, the `chains.js` entry,
   `EulerChains.json`, and the generated `verify/` changes.

If viem's default RPC for the chain is unusable, set
`DEPLOYMENT_RPC_URL_<chainId>` for local runs. For CI, bump viem in this repo
to a release whose default works, then move the euler-interfaces CI pin. The
report title is the viem chain's name.

## Add an audit

1. Append an entry to `verify/audits.json`:
   - `commits.final` = the **last revision the auditors reviewed** (revision
     table in the report; else the audit tag; else fix-PR merge commits —
     see `manifests/AUDITS-REVIEW.md` for the pin-selection ladder).
   - `scope` = the file list/prefixes as stated by the report.
   - `confidence` per the ladder; `signed_off: true` only after human review.
2. Commit the PDF to the source repo's `audits/` and pin the `report` URL to
   a commit, not `master`.
3. The frontier engine picks it up automatically; residuals it newly covers
   collapse in the next report regeneration.

## Handle a waiver

For code that legitimately cannot be bytecode-proven (canonical example:
Linea's size-optimized `eulerEarnFactory` variant whose exact source was
never committed):

```json
"waiver": { "reason": "<what and why, with links>", "signed_by": "<name>", "date": "YYYY-MM-DD" }
```

Waivers are loud by design: reports render them, reviewers see them, and the
validator rejects waivers missing any field. A waiver is a debt marker, not
an exemption — prefer reconstructing and tagging the real source.

## Rotate or fix an RPC endpoint

- Public endpoints are viem's defaults for the chain, tried in order, so one
  broken endpoint only degrades that chain. Locally, `DEPLOYMENT_RPC_URL_<chainId>`
  goes first. If viem's default stays broken, bump viem to a release that fixes
  it (curl-verify `eth_chainId` first), then move the euler-interfaces CI pin.

## Re-run everything from scratch (integrator instructions)

```bash
git clone https://github.com/euler-xyz/euler-verifier && cd euler-verifier
pnpm install
pnpm verify --manifest <euler-interfaces>/verify/manifest.json \
  --addresses <euler-interfaces>/addresses --chain 1 --no-explorer

# re-render every report and verify/README.md from the committed inputs
pnpm add-entries --interfaces <euler-interfaces> --render
```

No secrets required on chains with public RPC defaults. Verdicts are
independently reproducible — that reproducibility, not this repo's word, is
the guarantee.

## Failure triage

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `MISMATCH`, sizes differ | wrong commit or profile | check `profile.context`; try the deployment repo's settings |
| `MISMATCH`, diverges mid-code | embedded child code genuinely differs | wrong commit; digests of embedded children the compiler places are already masked, so a difference there is real — investigate, don't waive blindly. A child whose code occurs twice in the creation code is left unmasked on purpose |
| `build-error: submodule` | nested gitlink force-pushed away upstream | best-effort fallback handles it; if the missing dep is actually imported, pin a mirror |
| `rpc: all endpoints failed` | endpoints unavailable | rotate per above |
| `no RPC endpoint for chain …` | chain missing from `EulerChains.json`, or viem doesn't resolve it | add the chain to euler-interfaces, set `viemName`, bump viem, or set `DEPLOYMENT_RPC_URL_<chainId>` |
| `NOT PROVEN` from `add-entries` | no candidate is the deployed commit + profile | pass the deploying checkout (`--candidates-from`) or the commit (`--candidate`) |
| `not a full 40-hex commit SHA` | branch/tag pin in manifest, submodule pin or baseline | resolve to the SHA; pins are immutable by design |
| `EulerChains.json addresses differ …` | `node chains.js` not run after an address change | run it in euler-interfaces and commit the result |
| `… has different addresses in …` | one key in two address files with different values (a zero address included) | keep the published one in euler-interfaces, remove the other |
| `submodule override path … is not an initialized submodule` | an override names the root, a plain folder or an uninitialized submodule | fix `evidence.submoduleOverrides` to name the submodule path |
| `submodule override … is at …, not at …` | a later override of a parent reset a submodule inside it | list parents before the submodules inside them |
| `NOT WRITTEN …` from `add-entries` | the entry proved but its chain's report did not render | fix the `NOT RENDERED` cause and rerun |
| `… was proven at 0x…; regenerate it` | the contract was redeployed | `pnpm add-entries` (with `--candidate`/`--candidates-from` for a new commit) |
| `has origin …, expected …` | an engine clone points elsewhere | delete that directory under `repos/engine`; the engine clones it again |
| `EVault modules not verified` / `EulerSwap management not verified` | delegated-code verification failed (RPC or build) | fix the cause and rerun; the chain's report is not written until it passes |

## Ownership

- Deploy-time manifest entries: the deployer, with `pnpm add-entries` (enforced by the required check).
- audits.json sign-off: protocol security owner.
- Toolchain (this repo): <owner — to be named at P5 handoff>.
- Alerting: none by design. Verification is a required check on
  euler-interfaces PRs and there are no scheduled jobs, so every failure
  surfaces exactly where someone is already looking — as a red check on the
  PR that caused it. Nothing can fail silently.
