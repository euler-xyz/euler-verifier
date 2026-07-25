# euler-verifier Runbook

Operating procedures for the deployed-code verification system. The design
contract: **reports are a pure function of committed inputs** (addresses in
euler-interfaces, `verify/manifest.json`, `verify/audits.json`). Nothing runs
on a schedule; everything regenerates through PRs.

## Add a deployment (the common case)

Done by whoever deploys, **in the same euler-interfaces PR that adds the
address** — the required check makes it impossible to forget.

1. Deploy the contract; note repo + exact commit + compile settings.
2. In the euler-interfaces PR, alongside the address change, add the manifest
   entry under `verify/manifest.json`:

   ```json
   "swapVerifier": {
     "repo": "euler-xyz/evk-periphery",
     "commit": "<full 40-hex SHA — branch/tag pins are rejected>",
     "contractName": "SwapVerifier",
     "profile": { "context": "evk-periphery", "solc": "0.8.24", "optimizer_runs": 20000, "evm_version": "cancun" },
     "verified": "bytecode",
     "waiver": null
   }
   ```

3. CI proves it (or fails the PR). To pre-check locally:

   ```bash
   pnpm verify --manifest verify/manifest.json --addresses ../euler-interfaces/addresses \
     --chain <chainId> --contract <key> --no-explorer
   ```

If verification fails: wrong commit, wrong profile, or the code was deployed
from an unpushed tree. Fix the pin, or use a waiver (below) — never merge red.

## Add a chain

1. euler-interfaces PR adds `addresses/<chainId>/…` (existing process).
2. In euler-verifier `networks.json`, add the network: chain_id, name,
   status, explorer_url/api + `api_type`, and a keyless public `rpc` list —
   verify each endpoint with `eth_chainId` before committing (chainlist.org
   is the source of choice).
3. Optionally export `DEPLOYMENT_RPC_URL_<chainId>` for a premium endpoint
   (public defaults from `networks.json` are used otherwise); mirror any new
   var names into `.env.example`.
4. Manifest entries for every deployed allowlisted contract, as above. The
   completeness check (`src/check-completeness.ts`) lists what is missing.

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

- Public fallbacks: edit the network's `rpc` array in `networks.json`
  (curl-verify `eth_chainId` first). One broken endpoint only degrades that
  chain — the engine tries the list in order.

## Re-run everything from scratch (integrator instructions)

```bash
git clone https://github.com/euler-xyz/euler-verifier && cd euler-verifier
pnpm install
pnpm verify --manifest <euler-interfaces>/verify/manifest.json \
  --addresses <euler-interfaces>/addresses --chain 1 --no-explorer
```

No secrets required on chains with public RPC defaults. Verdicts are
independently reproducible — that reproducibility, not this repo's word, is
the guarantee.

## Failure triage

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `MISMATCH`, sizes differ | wrong commit or profile | check `profile.context`; try the deployment repo's settings |
| `MISMATCH`, diverges mid-code | embedded child code genuinely differs | wrong commit; if only paths differ the digest masking already handles it — investigate, don't waive blindly |
| `build-error: submodule` | nested gitlink force-pushed away upstream | best-effort fallback handles it; if the missing dep is actually imported, pin a mirror |
| `rpc: all endpoints failed` | endpoints unavailable | rotate per above |
| `not a full 40-hex commit SHA` | branch/tag pin in manifest | resolve to the SHA; pins are immutable by design |

## Ownership

- Deploy-time manifest entries: the deployer (enforced by the required check).
- audits.json sign-off: protocol security owner.
- Toolchain (this repo): <owner — to be named at P5 handoff>.
- Alerting: none by design. Verification is a required check on
  euler-interfaces PRs and there are no scheduled jobs, so every failure
  surfaces exactly where someone is already looking — as a red check on the
  PR that caused it. Nothing can fail silently.
