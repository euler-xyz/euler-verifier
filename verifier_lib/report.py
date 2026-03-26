"""
Report generation for contract verification results.

Produces markdown reports with:
- Summary table of all contracts and their verification status
- Deployment commit links to GitHub
- "Changes Since Deployment" diffs scoped to each contract's source files
"""

import re
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from .config import NetworkConfig, ROOT_DIR
from .commits import get_repo_for_contract, get_github_url, EULERSWAP_V1_CONTRACTS, EULERSWAP_V1_TAG

EVK_PERIPHERY_URL = "https://github.com/euler-xyz/evk-periphery"

# Matches 40-char (full) or 7+ char (short) hex SHA hashes
_SHA_HASH_RE = re.compile(r'^[0-9a-fA-F]+$')

# Network keys that need special title casing in reports
_TITLE_OVERRIDES = {
    "mainnet": "Mainnet",
    "bsc": "BSC",
    "bob": "BOB",
    "tac": "TAC",
}


def short_ref(ref: str) -> str:
    """Shorten a git SHA hash to 8 chars for display. Keeps tag/branch names intact."""
    if len(ref) > 8 and _SHA_HASH_RE.match(ref):
        return ref[:8]
    return ref


def clean_ref(ref: str) -> str:
    """Strip 'origin/' prefix from git refs so they work as GitHub URL paths."""
    if ref.startswith("origin/"):
        return ref[7:]
    return ref


@dataclass
class VerificationResult:
    """Result of verifying a single deployed contract against its source repository."""

    contract_name: str
    address: str
    verified: bool

    # The commit in the contract's source repo (e.g., euler-vault-kit, euler-earn)
    # where the deployed bytecode was found to match
    source_commit: Optional[str] = None

    # The evk-periphery commit that pins this submodule version.
    # Only set for submodule-based contracts (EVK, EVC, reward-streams, etc.),
    # not for standalone repos (euler-earn, euler-swap) or native evk-periphery contracts.
    evk_periphery_commit: Optional[str] = None

    matching_files: int = 0
    total_files: int = 0

    # Diff lines between explorer source and local (for unverified contracts)
    diff_lines: List[str] = field(default_factory=list)

    # Diff between deployment commit and current master (for "Changes Since Deployment")
    diff_vs_master: Optional[str] = None

    # Source file paths from the block explorer (e.g., src/Swaps/SwapVerifier.sol).
    # Used to scope diffs to only the contract's actual compilation files.
    source_paths: List[str] = field(default_factory=list)

    error: Optional[str] = None

    @property
    def repo_name(self) -> str:
        """Source repository name (e.g., 'euler-vault-kit', 'evk-periphery')."""
        name, _, _ = get_repo_for_contract(self.contract_name)
        return name

    @property
    def github_path(self) -> str:
        """GitHub org/repo path (e.g., 'euler-xyz/euler-vault-kit')."""
        _, path, _ = get_repo_for_contract(self.contract_name)
        return path

    @property
    def source_repo_url(self) -> str:
        return f"https://github.com/{self.github_path}"


def generate_report(config: NetworkConfig, results: List[VerificationResult], suffix: str = "") -> Path:
    """
    Generate markdown verification report.
    
    Args:
        config: Network configuration
        results: List of verification results
        suffix: Optional suffix for filename (e.g., "_test" for comparison)
    
    Returns:
        Path to generated report file
    """
    results_dir = ROOT_DIR / "results"
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine network name for filename (uses key from networks.json)
    network_name = config.key
    
    report_path = results_dir / f"{network_name}{suffix}.md"
    
    verified_count = sum(1 for r in results if r.verified)
    error_count = sum(1 for r in results if r.error)
    unmatched_count = sum(1 for r in results if not r.verified and not r.error)
    total_count = len(results)

    title_name = _TITLE_OVERRIDES.get(network_name, network_name.capitalize())
    
    lines = [
        f"# {title_name} Contract Verification Report",
        "",
        "## Summary",
        "",
        "| Status | Count |",
        "|--------|-------|",
        f"| ✓ Verified (exact match) | {verified_count} |",
        f"| ✗ No exact commit found | {unmatched_count} |",
        f"| ~ Standalone with diff | 0 |",
        f"| - Error | {error_count} |",
        f"| **Total** | **{total_count}** |",
        "",
        "## Verified Contracts",
        "",
        "| Contract | Address | Source Repo | Source Commit | evk-periphery | Files |",
        "|----------|---------|-------------|---------------|---------------|-------|",
    ]
    
    # Sort results alphabetically by contract name (match legacy format)
    results = sorted(results, key=lambda r: r.contract_name.lower())

    # Add result rows
    for r in results:
        addr_short = f"`{r.address[:10]}...`"
        addr_link = f"[{addr_short}]({config.explorer_url}/address/{r.address})"
        
        if r.verified and r.source_commit:
            repo_name, github_path, _ = get_repo_for_contract(r.contract_name)
            repo_link = f"[{repo_name}](https://github.com/{github_path})"
            
            commit_short = short_ref(clean_ref(r.source_commit))
            commit_url = f"https://github.com/{github_path}/tree/{clean_ref(r.source_commit)}"
            commit_link = f"[`{commit_short}`]({commit_url})"
            files_str = f"{r.matching_files}/{r.total_files}" if r.total_files > 0 else "-"
            
            # evk-periphery column
            if r.contract_name.startswith("eulerSwapV1"):
                evk_link = "-"  # Standalone V1
            elif repo_name == "euler-earn":
                evk_link = "-"  # Standalone euler-earn
            elif r.evk_periphery_commit:
                evk_short = short_ref(r.evk_periphery_commit)
                evk_link = f"[`{evk_short}`]({EVK_PERIPHERY_URL}/tree/{r.evk_periphery_commit})"
            elif r.source_commit == "master":
                evk_link = f"[`master`]({EVK_PERIPHERY_URL})"
            else:
                evk_link = f"[`{commit_short}`]({EVK_PERIPHERY_URL}/tree/{r.source_commit})"
            
            lines.append(f"| ✓ {r.contract_name} | {addr_link} | {repo_link} | {commit_link} | {evk_link} | {files_str} |")
        elif r.error:
            lines.append(f"| ✗ {r.contract_name} | {addr_link} | - | Error: {r.error} | - | - |")
        else:
            repo_name, github_path, _ = get_repo_for_contract(r.contract_name)
            repo_link = f"[{repo_name}](https://github.com/{github_path})"
            files_str = f"{r.matching_files}/{r.total_files}" if r.total_files > 0 else "-"
            lines.append(f"| ✗ {r.contract_name} | {addr_link} | {repo_link} | not found | - | {files_str} |")
    
    # Add diff section for non-verified contracts
    contracts_with_diff = [r for r in results if not r.verified and r.diff_lines]
    if contracts_with_diff:
        lines.extend([
            "",
            "",
            "## Contracts Without Exact Match",
            "",
            "These contracts could not be matched to any commit in the repository.",
            "Showing diff between explorer source and current `master`:",
        ])
        
        for r in contracts_with_diff:
            lines.extend([
                "",
                f"### {r.contract_name}",
                "",
                f"- **Address:** [`{r.address}`]({config.explorer_url}/address/{r.address})",
                f"- **Files matching:** {r.matching_files}/{r.total_files}",
                "",
                "```diff",
            ])
            # Limit diff to 100 lines
            diff_to_show = r.diff_lines[:100]
            lines.extend(diff_to_show)
            if len(r.diff_lines) > 100:
                lines.append(f"... ({len(r.diff_lines) - 100} more lines)")
            lines.append("```")
    
    # Add "Changes Since Deployment" section
    # Include contracts not deployed from master (where source_commit != "master")
    # Exclude EulerSwap V1 - eulerswap-1.0 tag IS their production version (V2 is different)
    contracts_with_changes = [
        r for r in results 
        if r.verified 
        and r.source_commit 
        and r.source_commit != "master"
        and r.source_commit != "main"
        and r.source_commit != EULERSWAP_V1_TAG
        and r.contract_name not in EULERSWAP_V1_CONTRACTS
    ]

    if contracts_with_changes:
        lines.extend([
            "",
            "",
            "## Changes Since Deployment",
            "",
            "This section shows what has changed in the source code between the deployment commit and current `master`.",
            "These diffs help identify any changes made to the codebase after deployment.",
            "",
        ])
        
        # Group by (repo_name, source_commit) to deduplicate identical diffs
        by_repo_commit = defaultdict(list)
        for r in contracts_with_changes:
            by_repo_commit[(r.repo_name, r.source_commit)].append(r)

        for (repo_name, source_commit), group in sorted(by_repo_commit.items()):
            representative = group[0]
            _, github_path, _ = get_repo_for_contract(representative.contract_name)
            clean_commit = clean_ref(source_commit)
            commit_short = short_ref(clean_commit)
            commit_url = f"https://github.com/{github_path}/tree/{commit_short}"
            compare_url = f"https://github.com/{github_path}/compare/{commit_short}...master"

            contract_names = ", ".join(r.contract_name for r in group)
            lines.append(f"### {repo_name} @ `{commit_short}`")
            lines.append("")
            lines.append(f"**Contracts:** {contract_names}")
            lines.append("")
            lines.append(f"- **Deployed from:** [`{commit_short}`]({commit_url})")
            lines.append(f"- **Compare to master:** [`{commit_short}...master`]({compare_url})")

            # Add evk-periphery reference if applicable
            if representative.evk_periphery_commit and repo_name != "evk-periphery":
                evk_short = short_ref(representative.evk_periphery_commit)
                lines.append(f"- **evk-periphery:** [`{evk_short}`]({EVK_PERIPHERY_URL}/tree/{evk_short})")

            lines.append("")

            # Combine diffs from all contracts in the group (each is scoped to its own files)
            seen_diffs = set()
            combined_diff_parts = []
            for r in group:
                if r.diff_vs_master and r.diff_vs_master not in seen_diffs:
                    seen_diffs.add(r.diff_vs_master)
                    combined_diff_parts.append(r.diff_vs_master)
            diff = "\n".join(combined_diff_parts) if combined_diff_parts else None
            if diff:
                diff_lines_list = diff.split('\n')
                if len(diff_lines_list) > 100:
                    lines.append("```diff")
                    lines.extend(diff_lines_list[:100])
                    lines.append("```")
                    lines.append("")
                    lines.append(f"_Showing first 100 of {len(diff_lines_list)} lines. [View full diff on GitHub]({compare_url})_")
                elif diff_lines_list and any(line.strip() for line in diff_lines_list):
                    lines.append("```diff")
                    lines.extend(diff_lines_list)
                    lines.append("```")
                else:
                    lines.append("_No diff available - see GitHub compare link above._")
            else:
                lines.append("_No diff available - see GitHub compare link above._")

            lines.append("")
    
    # Write report
    content = "\n".join(lines) + "\n"
    report_path.write_text(content)
    
    return report_path


def _parse_report_summary(report_path: Path, networks: dict):
    """Extract network key and contract counts from a report file.

    Args:
        report_path: Path to a network report markdown file.
        networks: Dict of network configs from networks.json, keyed by name.

    Returns (key, chain_id, verified, total) or None if the file can't be parsed.
    """
    key = report_path.stem  # e.g., "mainnet" from "mainnet.md"

    # Look up chain ID from networks.json
    config = networks.get(key)
    chain_id = config.chain_id if config else 0

    try:
        content = report_path.read_text()
    except IOError:
        return None

    # Count verified/total from contract table rows (contain address links)
    verified = sum(1 for line in content.split("\n") if line.startswith("| ✓ ") and "[`0x" in line)
    unmatched = sum(1 for line in content.split("\n") if line.startswith("| ✗ ") and "[`0x" in line)
    total = verified + unmatched

    if total == 0:
        return None

    return key, chain_id, verified, total


def generate_results_readme() -> Path:
    """Generate results/README.md by scanning existing report files.

    Builds the network table from whatever *.md reports exist in results/.
    Preserves the manual "Notes" section from the existing README.
    Works after any run (--all, single network, or CI).
    """
    results_dir = ROOT_DIR / "results"
    readme_path = results_dir / "README.md"

    # Preserve existing Notes section (manually written context like "24KB optimizations")
    notes_section = ""
    if readme_path.exists():
        content = readme_path.read_text()
        notes_marker = "\n## Notes\n"
        if notes_marker in content:
            notes_section = notes_marker + content.split(notes_marker, 1)[1]

    # Scan all report files
    from .config import load_networks
    networks = load_networks()

    entries = []
    for report_file in sorted(results_dir.glob("*.md")):
        if report_file.name == "README.md":
            continue
        parsed = _parse_report_summary(report_file, networks)
        if parsed:
            entries.append(parsed)

    # Sort by chain ID
    entries.sort(key=lambda x: x[1])

    # Build table rows
    rows = []
    for key, chain_id, verified, total in entries:
        pct = round(verified / total * 100) if total > 0 else 0
        status = "✅" if verified == total else "⚠️"
        title = _TITLE_OVERRIDES.get(key, key.capitalize())
        rows.append(
            f"| [{title}]({key}.md) | {chain_id} | {status} {pct}% | {verified}/{total} |"
        )

    table = "\n".join(rows)

    readme = f"""# Euler Contract Verification Reports

## Networks

| Network | Chain ID | Status | Contracts |
|---------|----------|--------|-----------|
{table}

## Report Structure

Each report contains:

1. **Summary table** — all contracts with address, source repo, deployment commit, evk-periphery ref, and file match count
2. **Changes Since Deployment** — diffs between the deployment commit and current `master`, scoped to only the files that are part of each deployed contract

## Running Verification

```bash
# Verify a single network
uv run python verify.py mainnet

# Verify all production networks
uv run python verify.py --all

# Deep search through git history
uv run python verify.py mainnet --exhaustive

# List available networks
uv run python verify.py --list
```
"""

    if notes_section:
        readme += notes_section
    else:
        readme += "\n"

    readme_path.write_text(readme)
    return readme_path


def update_root_readme(all_results: dict) -> None:
    """Update the network table in the root README.md.

    Replaces the table between '### Production Networks' and the next '## ' heading,
    preserving all other content. No-op if the README doesn't have the expected markers.
    """
    readme_path = ROOT_DIR / "README.md"
    if not readme_path.exists():
        return

    content = readme_path.read_text()

    start_marker = "### Production Networks\n"
    if start_marker not in content:
        return

    # Find the table section
    before, rest = content.split(start_marker, 1)

    # Find the next ## heading after the table
    lines = rest.split("\n")
    end_idx = None
    for i, line in enumerate(lines):
        if line.startswith("## ") and i > 0:
            end_idx = i
            break

    if end_idx is None:
        return

    after = "\n".join(lines[end_idx:])

    # Build new table rows sorted by chain ID
    rows = []
    for network_name, (config, results) in sorted(
        all_results.items(), key=lambda x: x[1][0].chain_id
    ):
        verified = sum(1 for r in results if r.verified)
        total = len(results)
        status = "✅" if verified == total else "⚠️"
        title = _TITLE_OVERRIDES.get(config.key, config.key.capitalize())
        rows.append(
            f"| {title} | {config.chain_id} | {status} {verified}/{total}"
            f" | [{config.key}.md](results/{config.key}.md) |"
        )

    table = "\n".join([
        "",
        "| Network | Chain ID | Status | Report |",
        "|---------|----------|--------|--------|",
        *rows,
        "",
        "",
    ])

    readme_path.write_text(before + start_marker + table + after)


def print_summary(config: NetworkConfig, results: List[VerificationResult]):
    """Print verification summary to console."""
    verified_count = sum(1 for r in results if r.verified)
    total_count = len(results)
    
    print("=" * 60, flush=True)
    print(f"Results: {verified_count}/{total_count} contracts verified", flush=True)
    
    # Show failed contracts
    failed = [r for r in results if not r.verified]
    if failed:
        print("\nFailed contracts:", flush=True)
        for r in failed:
            if r.error:
                print(f"  - {r.contract_name}: {r.error}", flush=True)
            else:
                print(f"  - {r.contract_name}: {r.matching_files}/{r.total_files} files match", flush=True)
