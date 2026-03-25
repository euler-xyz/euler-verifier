"""
Report generation for verification results.
"""

from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import re

from .config import NetworkConfig, ROOT_DIR
from .commits import get_repo_for_contract, get_github_url, EULERSWAP_V1_CONTRACTS, EULERSWAP_V1_TAG

_HEX_RE = re.compile(r'^[0-9a-fA-F]+$')

def short_ref(ref: str) -> str:
    """Shorten a git ref for display: truncate SHA hashes to 8 chars, keep tag/branch names intact."""
    if len(ref) > 8 and _HEX_RE.match(ref):
        return ref[:8]
    return ref


def clean_ref(ref: str) -> str:
    """Strip origin/ prefix from git refs for use in GitHub URLs."""
    if ref.startswith("origin/"):
        return ref[7:]
    return ref


@dataclass
class VerificationResult:
    """Result of verifying a single contract."""
    contract_name: str
    address: str
    verified: bool
    source_commit: Optional[str] = None  # Actual commit in source repo (e.g., euler-vault-kit)
    evk_periphery_commit: Optional[str] = None  # The evk-periphery commit (for reference)
    matching_files: int = 0
    total_files: int = 0
    diff_lines: List[str] = field(default_factory=list)
    diff_vs_master: Optional[str] = None  # Diff between deployment commit and master
    source_paths: List[str] = field(default_factory=list)  # src/ file paths from explorer
    error: Optional[str] = None
    
    @property
    def status_emoji(self) -> str:
        if self.error:
            return "❌"
        if self.verified:
            return "✅"
        return "⚠️"
    
    @property
    def repo_name(self) -> str:
        name, _, _ = get_repo_for_contract(self.contract_name)
        return name
    
    @property
    def github_path(self) -> str:
        _, path, _ = get_repo_for_contract(self.contract_name)
        return path
    
    @property
    def source_repo_url(self) -> str:
        return f"https://github.com/{self.github_path}"
    
    @property
    def source_commit_url(self) -> Optional[str]:
        if self.source_commit:
            return f"{self.source_repo_url}/tree/{self.source_commit}"
        return None
    
    @property
    def compare_url(self) -> Optional[str]:
        """URL to compare deployment commit to master."""
        if self.source_commit and self.source_commit != "master":
            return f"{self.source_repo_url}/compare/{self.source_commit}...master"
        return None


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
    
    # Count stats
    verified_count = sum(1 for r in results if r.verified)
    error_count = sum(1 for r in results if r.error)
    partial_count = sum(1 for r in results if not r.verified and not r.error)
    total_count = len(results)
    
    # Use short network name for title (match legacy format)
    title_name = network_name.capitalize()
    if network_name == "mainnet":
        title_name = "Mainnet"
    elif network_name == "bsc":
        title_name = "BSC"
    elif network_name == "bob":
        title_name = "BOB"
    
    lines = [
        f"# {title_name} Contract Verification Report",
        "",
        "## Summary",
        "",
        "| Status | Count |",
        "|--------|-------|",
        f"| ✓ Verified (exact match) | {verified_count} |",
        f"| ✗ No exact commit found | {partial_count} |",
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
    
    EVK_PERIPHERY_URL = "https://github.com/euler-xyz/evk-periphery"
    
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
    
    EVK_PERIPHERY_URL = "https://github.com/euler-xyz/evk-periphery"
    
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

            # Show diff once for the group (all contracts share the same diff)
            diff = representative.diff_vs_master
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
