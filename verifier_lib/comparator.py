"""
Source code comparison with Foundry remapping support.
"""

import re
from difflib import unified_diff
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class SourceComparator:
    """
    Compare explorer source code against local repository.

    Includes:
    - Foundry remapping support (evk/, @openzeppelin/)
    - Path normalization for different lib structures
    - Duplicate file detection and skipping
    """

    # Foundry remappings: prefix -> replacement
    REMAPPINGS = {
        "evk/": "lib/euler-vault-kit/src/",
        "@openzeppelin/contracts/": "lib/openzeppelin-contracts/contracts/",
    }

    def __init__(self, repo_path: Path, submodule_paths: Optional[List[str]] = None):
        """
        Initialize comparator.

        Args:
            repo_path: Path to the repository root
            submodule_paths: List of submodule paths to search (e.g., ["lib/euler-vault-kit"])
        """
        self.repo_path = repo_path
        self.submodule_paths = submodule_paths or []

    def find_local_file(self, explorer_path: str) -> Optional[Path]:
        """
        Find a local file matching the explorer path.

        Applies Foundry remappings and searches in submodule paths.

        For nested library dependencies (lib/openzeppelin-contracts/, lib/forge-std/, etc.),
        we always try the repo root first. The root lib is the canonical version for the
        deployment repo. Only fall back to submodule nested libs if root doesn't have it.
        """
        # Apply Foundry remappings
        remapped_path = explorer_path
        for prefix, replacement in self.REMAPPINGS.items():
            if explorer_path.startswith(prefix):
                remapped_path = replacement + explorer_path[len(prefix):]
                break

        # Check if this is a nested library path that might have different versions
        # in submodules vs repo root. Submodules often pin their own versions of common libs.
        is_nested_lib = explorer_path.startswith("lib/") and any(
            explorer_path.startswith(f"lib/{lib}/")
            for lib in [
                "openzeppelin-contracts", "openzeppelin-contracts-upgradeable",
                "forge-std", "ds-test",
                "ethereum-vault-connector",  # reward-streams has its own EVC
            ]
        )

        for path_to_try in [remapped_path, explorer_path]:
            if is_nested_lib and self.submodule_paths:
                # For nested libs (OZ, EVC, forge-std), always try repo root first.
                # The root lib is the canonical version for the deployment repo.
                # Only fall back to submodule nested libs if root doesn't have it.
                local_path = self.repo_path / path_to_try
                if local_path.exists():
                    return local_path
                for submod_path in self.submodule_paths:
                    local_path = self.repo_path / submod_path / path_to_try
                    if local_path.exists():
                        return local_path
            else:
                # For other paths, try repo root first (original behavior)
                local_path = self.repo_path / path_to_try
                if local_path.exists():
                    return local_path
                # Then submodules
                for submod_path in self.submodule_paths:
                    local_path = self.repo_path / submod_path / path_to_try
                    if local_path.exists():
                        return local_path

        # Try partial path matching (strip leading directories)
        parts = explorer_path.split("/")
        for i in range(len(parts)):
            subpath = "/".join(parts[i:])

            if is_nested_lib and self.submodule_paths:
                local_path = self.repo_path / subpath
                if local_path.exists():
                    return local_path
                for submod_path in self.submodule_paths:
                    local_path = self.repo_path / submod_path / subpath
                    if local_path.exists():
                        return local_path
            else:
                local_path = self.repo_path / subpath
                if local_path.exists():
                    return local_path
                for submod_path in self.submodule_paths:
                    local_path = self.repo_path / submod_path / subpath
                    if local_path.exists():
                        return local_path

        return None

    def normalize_source(self, content: str) -> str:
        """
        Normalize source code for comparison.

        - Replaces email addresses with placeholder
        - Normalizes line endings
        - Normalizes import paths (removes lib prefixes)
        - Strips trailing whitespace
        """
        # Replace email addresses
        normalized = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', 'EMAIL', content)

        # Normalize line endings
        normalized = normalized.replace('\r\n', '\n')

        # Normalize import paths (Foundry remappings)
        # Standard lib paths - remove the lib prefix
        normalized = re.sub(r'lib/ethereum-vault-connector/src/', '', normalized)
        normalized = re.sub(r'lib/euler-vault-kit/src/', '', normalized)
        normalized = re.sub(r'lib/reward-streams/src/', '', normalized)
        normalized = re.sub(r'lib/fee-flow/src/', '', normalized)
        normalized = re.sub(r'lib/euler-earn/src/', '', normalized)
        normalized = re.sub(r'lib/euler-swap/src/', '', normalized)
        normalized = re.sub(r'lib/openzeppelin-contracts/contracts/', '', normalized)

        # evk/ is a common remapping to lib/euler-vault-kit/src/
        normalized = re.sub(r'evk/', '', normalized)

        # solmate path variations (solmate/src/... vs solmate/...)
        normalized = re.sub(r'solmate/src/', 'solmate/', normalized)

        # Relative lib paths (from src/ directory): ../lib/...
        normalized = re.sub(r'\.\./lib/openzeppelin-contracts/contracts/', '', normalized)
        normalized = re.sub(r'\.\./lib/ethereum-vault-connector/src/', '', normalized)

        # @openzeppelin/contracts/ -> normalized away
        normalized = re.sub(r'@openzeppelin/contracts/', '', normalized)

        # Strip trailing whitespace and trailing empty lines
        lines = normalized.split('\n')
        lines = [line.rstrip() for line in lines]
        while lines and not lines[-1]:
            lines.pop()

        return '\n'.join(lines)

    def compare_sources(self, explorer_sources: Dict[str, Any]) -> Tuple[int, int, List[str]]:
        """
        Compare explorer sources against local repository.

        Args:
            explorer_sources: Dict of filepath -> {"content": source_code}

        Returns:
            Tuple of (matching_count, total_count, diff_lines)
        """
        matching = 0
        total = 0
        diff_lines = []

        # Check for duplicate @openzeppelin paths (skip if lib/ version exists)
        lib_paths = {
            fp for fp in explorer_sources.keys()
            if fp.startswith('lib/openzeppelin-contracts/contracts/')
        }

        for filepath, source_info in explorer_sources.items():
            # Only process Solidity files
            if not filepath.endswith('.sol'):
                continue

            # Skip @openzeppelin/ duplicates if lib/ version exists
            if filepath.startswith('@openzeppelin/contracts/'):
                lib_equiv = 'lib/openzeppelin-contracts/contracts/' + filepath[24:]
                if lib_equiv in lib_paths:
                    continue  # Skip duplicate, lib/ version will be checked

            total += 1
            explorer_content = source_info.get("content", "")
            local_file = self.find_local_file(filepath)

            if not local_file:
                diff_lines.append(f"--- {filepath}: NOT FOUND locally")
                continue

            try:
                local_content = local_file.read_text()
            except Exception:
                diff_lines.append(f"--- {filepath}: Could not read")
                continue

            # Normalize and compare
            norm_explorer = self.normalize_source(explorer_content)
            norm_local = self.normalize_source(local_content)

            if norm_explorer == norm_local:
                matching += 1
            else:
                # Generate diff (limited to first 50 lines)
                diff = list(unified_diff(
                    norm_local.split('\n'),
                    norm_explorer.split('\n'),
                    fromfile=f"local/{filepath}",
                    tofile=f"explorer/{filepath}",
                    lineterm=""
                ))
                if diff:
                    diff_lines.extend(diff[:50])

        return matching, total, diff_lines
