"""
Source code comparison between block explorer and local repository.

Handles Foundry remappings, submodule path resolution, and import path
normalization to produce accurate file-by-file comparisons despite
different path conventions across explorers and local builds.
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

        for path_to_try in [remapped_path, explorer_path]:
            found = self._try_path(path_to_try)
            if found:
                return found

        # Try partial path matching (strip leading directories)
        parts = explorer_path.split("/")
        for i in range(len(parts)):
            subpath = "/".join(parts[i:])
            found = self._try_path(subpath)
            if found:
                return found

        return None

    def _try_path(self, path: str) -> Optional[Path]:
        """Look for a file at the given relative path, checking repo root first, then each submodule."""
        local_path = self.repo_path / path
        if local_path.exists():
            return local_path
        for submod_path in self.submodule_paths:
            local_path = self.repo_path / submod_path / path
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

        # Normalize import paths — strip all lib prefixes and path components
        # so different remapping styles (lib/euler-vault-kit/src/X, evk/X, ../lib/X) all match
        normalized = re.sub(
            r'(?:\.\./)?' r'lib/(?:ethereum-vault-connector|euler-vault-kit|reward-streams'
            r'|fee-flow|euler-earn|euler-swap)/src/', '', normalized)
        normalized = re.sub(r'lib/openzeppelin-contracts/contracts/', '', normalized)
        normalized = re.sub(r'@openzeppelin/contracts/', '', normalized)
        normalized = re.sub(r'evk/', '', normalized)
        normalized = re.sub(r'solmate/src/', 'solmate/', normalized)

        # Normalize import paths to filename only (handles flattened deployments
        # where e.g. "openzeppelin-contracts/access/Ownable.sol" becomes "../access/Ownable.sol")
        normalized = re.sub(r'(from\s+["\'])[^"\']*?([^/"\']+\.sol)(["\'])', r'\1\2\3', normalized)

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

            # Skip bare openzeppelin-contracts/ duplicates (missing lib/ prefix)
            if filepath.startswith('openzeppelin-contracts/'):
                lib_equiv = 'lib/' + filepath
                if not lib_equiv.startswith('lib/openzeppelin-contracts/contracts/'):
                    lib_equiv = 'lib/openzeppelin-contracts/contracts/' + filepath[len('openzeppelin-contracts/'):]
                if lib_equiv in lib_paths:
                    continue

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
