"""
Report generation for verification results.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from .config import NetworkConfig, ROOT_DIR
from .commits import get_repo_for_contract, get_github_url


@dataclass
class VerificationResult:
    """Result of verifying a single contract."""
    contract_name: str
    address: str
    verified: bool
    commit: Optional[str] = None
    matching_files: int = 0
    total_files: int = 0
    diff_lines: List[str] = field(default_factory=list)
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
    def github_url(self) -> Optional[str]:
        if self.commit:
            return get_github_url(self.contract_name, self.commit)
        return None


def generate_report(config: NetworkConfig, results: List[VerificationResult]) -> Path:
    """
    Generate markdown verification report.
    
    Args:
        config: Network configuration
        results: List of verification results
    
    Returns:
        Path to generated report file
    """
    results_dir = ROOT_DIR / "results"
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine network name for filename
    network_name = config.name.lower().replace(" ", "_")
    for key_name in ["mainnet", "arbitrum", "base", "bsc", "avalanche", "linea", 
                      "gnosis", "optimism", "polygon", "swell", "bob", "unichain",
                      "berachain", "sonic"]:
        if key_name in network_name or network_name in key_name:
            network_name = key_name
            break
    
    report_path = results_dir / f"{network_name}.md"
    
    # Count stats
    verified_count = sum(1 for r in results if r.verified)
    total_count = len(results)
    percentage = (verified_count / total_count * 100) if total_count > 0 else 0
    
    status_emoji = "✅" if verified_count == total_count else "⚠️"
    
    lines = [
        f"# {config.name} Contract Verification Report",
        "",
        f"**Chain ID:** {config.chain_id}",
        f"**Explorer:** [{config.explorer_url}]({config.explorer_url})",
        f"**Status:** {status_emoji} {verified_count}/{total_count} contracts verified",
        "",
        "## Summary",
        "",
        "| Contract | Address | Status | Source Repo | Commit |",
        "|----------|---------|--------|-------------|--------|",
    ]
    
    # Add result rows
    for r in results:
        addr_short = f"{r.address[:10]}..."
        addr_link = f"[{addr_short}]({config.explorer_url}/address/{r.address})"
        
        if r.verified and r.commit:
            repo_name, github_path, _ = get_repo_for_contract(r.contract_name)
            repo_link = f"[{repo_name}](https://github.com/{github_path})"
            commit_short = r.commit[:8] if len(r.commit) > 8 else r.commit
            commit_link = f"[{commit_short}]({r.github_url})"
            lines.append(f"| {r.contract_name} | {addr_link} | {r.status_emoji} | {repo_link} | {commit_link} |")
        elif r.error:
            lines.append(f"| {r.contract_name} | {addr_link} | {r.status_emoji} | - | Error: {r.error} |")
        else:
            lines.append(f"| {r.contract_name} | {addr_link} | {r.status_emoji} | {r.repo_name} | - |")
    
    # Add diff section for non-verified contracts
    contracts_with_diff = [r for r in results if not r.verified and r.diff_lines]
    if contracts_with_diff:
        lines.extend([
            "",
            "## Contracts With Differences",
        ])
        
        for r in contracts_with_diff:
            lines.extend([
                "",
                f"### {r.contract_name}",
                "",
                "```diff",
            ])
            # Limit diff to 100 lines
            diff_to_show = r.diff_lines[:100]
            lines.extend(diff_to_show)
            if len(r.diff_lines) > 100:
                lines.append(f"... ({len(r.diff_lines) - 100} more lines)")
            lines.append("```")
    
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
