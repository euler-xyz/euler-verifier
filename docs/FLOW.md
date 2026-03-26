# Verification Flow

## CLI Paths

```
verify.py
|
+-- verify.py <network>          (single network)
|   |
|   +-- Network in networks.json?
|   |   +-- YES -> verify that network
|   |   +-- NO -> try int(network) as chain ID
|   |       +-- Valid chain ID -> discover_network() auto-detect explorer
|   |       |   +-- Explorer found -> verify
|   |       |   +-- No explorer -> error, exit 1
|   |       +-- Not a number -> error, exit 1
|   |
|   +-- Generate results/<network>.md
|   +-- Update results/README.md  <-- scans all *.md files on disk
|   +-- Root README.md: NOT touched
|
+-- verify.py --all              (all production networks)
|   |
|   +-- Load networks.json, filter status=production
|   +-- Verify each network -> results/<network>.md
|   +-- Update results/README.md  <-- scans all *.md files on disk
|   +-- Root README.md: NOT touched
|   +-- Print overall summary
|
+-- verify.py --all --update-readme
|   |
|   +-- Same as --all above, plus:
|   +-- Update root README.md table  <-- from in-memory results
|
+-- verify.py --all --test
|   |
|   +-- Same as --all but writes to *_test.md files
|   +-- results/README.md: NOT touched
|   +-- Root README.md: NOT touched
|
+-- verify.py --discover
|   |
|   +-- Scan euler-interfaces/addresses/ for unknown chain IDs
|   +-- Auto-detect explorer for each
|   +-- Verify discovered chains -> results/<network>.md
|   +-- Update results/README.md  <-- scans all *.md files on disk
|
+-- verify.py --list
    +-- Print available networks, exit
```

## results/README.md Generation

```
Scan results/*.md (excluding README.md)
  |
  v
For each report file:
  - key = filename stem (e.g., "mainnet")
  - chain_id = from networks.json
  - verified = count "| V " rows with address links
  - total = verified + "| X " rows
  |
  v
Sort by chain_id
Build markdown table
Preserve existing ## Notes section
Write results/README.md
```

## Scenario: New Network Added to euler-interfaces

Example: someone adds katana addresses to euler-interfaces.

```
1. Push to euler-interfaces: addresses/747474/
2. euler-interfaces CI triggers
3. CI runs: verify.py 747474
4. 747474 is in networks.json -> verifies katana
5. Generates results/katana.md
6. Scans results/*.md -> katana appears in table
7. Updates results/README.md
8. CI commits: results/katana.md + README.md
9. CI copies results/*.md -> verify/ folder

Root README.md: NOT touched (no --update-readme)
```

## Scenario: Weekly CI Cron in euler-verifier

```
1. Cron triggers: verify.py --all
2. Verifies all 14 production networks
3. Generates 14 results/<network>.md
4. Scans results/*.md -> builds table
5. Updates results/README.md
6. CI commits: results/ (if changed)

Root README.md: NOT touched (no --update-readme)
```

## Root README.md

Only updated by explicit local command:

```
verify.py --all --update-readme
```

Uses in-memory results (not file scan) because it needs the
NetworkConfig for each network to build the table with report links.

Developer commits and pushes manually.
