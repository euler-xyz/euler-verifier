# Euler Verifier Suite

A comprehensive verification suite for all Euler protocol contracts deployed across multiple networks. This tool verifies deployed bytecode against source code in Euler's repositories, identifies the exact git commit used for each deployment, and generates detailed reports with any differences.

## Features

- ✅ Verifies contracts across 15 production networks (+ 8 testing networks)
- 🔍 Identifies exact git commits used for deployments
- 📊 Generates both JSON and Markdown reports
- 🔄 Cross-references with block explorer verified sources
- 📝 Detailed diff reports for any discrepancies
- 💾 Caches results for faster reruns
- 🎯 Supports EVC, EVault, Price Oracles, Periphery, and Swap contracts

## Prerequisites

1. **Python 3.10+**
2. **uv** - Fast Python package manager
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
3. **Foundry** - Required for compiling contracts
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```
4. **Etherscan API Key** (optional but recommended)
   - Get one at: https://etherscan.io/apis
   - Works for all Etherscan-based explorers

## Installation

1. Clone this repository (if not already done):
   ```bash
   git clone <repo-url>
   cd euler-verifier
   ```

2. Install dependencies with uv:
   ```bash
   uv sync
   ```
   This will create a virtual environment and install all dependencies.

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your ETHERSCAN_API_KEY
   ```

4. Run setup to clone all Euler repositories:
   ```bash
   uv run euler-setup
   ```

## Production Networks

The verifier targets 15 production networks (status: 'production' in chains.js):
- Ethereum (1)
- Base (8453)
- Swell (1923)
- Sonic (146)
- BOB (60808)
- Berachain (80094)
- Avalanche (43114)
- BSC (56)
- Unichain (130)
- Arbitrum (42161)
- TAC (239)
- Linea (59144)
- HyperEVM (999)
- Plasma (9745)
- Monad (143)

Additionally, 8 testing networks are available (status: 'testing'):
- Optimism (10), Gnosis (100), Polygon (137), Corn (21000000), Morph (2818), Worldchain (480), Mantle (5000), Ink (57073)

## Usage

### Verify All EVC Deployments

**Production networks only (default):**
```bash
uv run euler-verify-evc
```

**Include beta and testing networks:**
```bash
uv run euler-verify-evc --all
```

**Other options:**
```bash
uv run euler-verify-evc --beta      # Production + Beta
uv run euler-verify-evc --testing   # Production + Testing
uv run euler-verify-evc --help      # Show all options
```

This will:
1. Fetch on-chain bytecode for each EVC deployment
2. Get verified source from block explorers (if available)
3. Find matching git commits in the ethereum-vault-connector repository
4. Generate detailed reports in the `results/` directory

Reports will group networks by tier (Production, Beta, Testing) with production networks listed first.

### Verify All Contracts

(Coming soon)
```bash
uv run euler-verify-all
```

## Output

After verification, you'll find two report files in the `results/` directory:

### JSON Report (`evc-verification.json`)
Structured data including:
- Network information
- Deployment dates and transaction hashes
- Git commit hashes and metadata
- Bytecode comparison results
- Diff summaries

### Markdown Report (`evc-verification.md`)
Human-readable report with:
- Summary statistics
- Verification table (Network | Address | Status | Commit | Date | Hash | Diffs)
- Detailed results for each network
- List of unique commits and their deployments

Example table output:
```
| Network   | Address | Status  | Git Commit | Deploy Date | Bytecode Hash | Diffs      |
|-----------|---------|---------|------------|-------------|---------------|------------|
| ethereum  | 0x0C9a... | ✓ Exact | a1b2c3d  | 2024-01-15  | 0x1234...     | ✓ None     |
| arbitrum  | 0x6302... | ~ Close | a1b2c3d  | 2024-01-16  | 0x5678...     | 2 lines... |
```

## Project Structure

```
euler-verifier/
├── euler_verifier/
│   ├── config.py         # Configuration and address parsing
│   ├── blockchain.py     # RPC calls and bytecode fetching
│   ├── explorer.py       # Block explorer API integration
│   ├── repository.py     # Git repository management
│   ├── compiler.py       # Foundry compilation wrapper
│   ├── matcher.py        # Commit matching algorithm
│   ├── reporter.py       # Report generation
│   ├── verify_evc.py     # EVC verification orchestrator
│   ├── verify_one.py     # Single contract verification
│   ├── verify_all.py     # All contracts verification
│   └── setup.py          # Setup script
├── repos/                # Cloned Euler repositories
├── results/              # Verification reports
├── cache/                # Cached data (bytecode, sources, compilations)
├── euler-interfaces/     # Submodule with addresses and ABIs
├── rpc_urls.json         # RPC endpoints for all networks
├── pyproject.toml        # Python project configuration
└── uv.lock              # Locked dependencies
```

## How It Works

### 1. Data Collection
- Reads deployment addresses from `euler-interfaces` submodule
- Fetches deployed bytecode via RPC calls
- Retrieves deployment timestamp from creation transaction
- Downloads verified source from block explorers (if available)

### 2. Commit Matching
- Clones source repository (e.g., ethereum-vault-connector)
- Iterates through git history (prioritizing commits before deployment date)
- Compiles each commit using Foundry
- Compares compiled bytecode with deployed bytecode
- Finds exact or closest match based on similarity

### 3. Diff Generation
- For non-exact matches, generates unified diff
- Compares verified source from explorer with compiled source
- Identifies specific files and lines that differ
- Categorizes differences (metadata, constructor args, etc.)

### 4. Report Generation
- Aggregates all verification results
- Generates summary statistics
- Creates JSON report for programmatic access
- Creates Markdown report for human review

## Configuration

### Network RPC URLs
Edit `rpc_urls.json` to add or update RPC endpoints:
```json
{
  "networks": {
    "1": {
      "name": "ethereum",
      "rpc_url": "https://..."
    }
  }
}
```

### Repository Configuration
Edit `src/config.js` to add new repositories or update paths:
```javascript
export const REPO_CONFIG = {
  evc: {
    name: 'ethereum-vault-connector',
    url: 'https://github.com/euler-xyz/ethereum-vault-connector.git',
    contractPath: 'src/EthereumVaultConnector.sol',
    contractName: 'EthereumVaultConnector'
  }
};
```

## Caching

The verifier caches several types of data to speed up reruns:

- **Bytecode cache** (`cache/bytecode/`) - On-chain bytecode and creation transactions
- **Source cache** (`cache/sources/`) - Verified source from block explorers
- **Compilation cache** (`cache/compilations/`) - Compiled bytecode for each commit

To clear the cache and start fresh:
```bash
rm -rf cache/*
```

## Troubleshooting

### "Foundry not found"
Install Foundry: https://book.getfoundry.sh/getting-started/installation

### "No RPC URL configured"
Check that the network has an RPC URL in `rpc_urls.json`

### "Compilation failed"
- Ensure Foundry is up to date: `foundryup`
- Check that the repository has a valid `foundry.toml`
- Some old commits may not compile with the latest Foundry

### "No matching commit found"
- The deployed bytecode might be from a modified version
- Try clearing the compilation cache
- Check the "closest match" in the report for clues

## Contributing

To add verification for additional contract types:

1. Add repository configuration in `src/config.js`
2. Create a new verification script (e.g., `src/verifyOracle.js`)
3. Add npm script in `package.json`
4. Update documentation

## License

MIT

## Documentation

- **[VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md)** - Complete step-by-step guide for verifying any contract
- **[FINDINGS.md](FINDINGS.md)** - Detailed findings from EVC verification on Ethereum mainnet
- **[verify.js](verify.js)** - Original verification script (inspiration)

## Important Notes

### Deployment vs. Development Repositories

**⚠️ Critical:** Contracts are deployed from **`evk-periphery`**, not standalone repositories!

The `evk-periphery` repository:
- Contains all contracts as submodules in `lib/`
- Uses unified `foundry.toml` with **20,000 optimizer runs**
- Deploys via `script/interactiveDeployment.sh`

Each standalone repo (ethereum-vault-connector, euler-vault-kit, etc.) has its own `foundry.toml` for **development** with different settings (often 10,000 runs).

**For verification, always use the deployment repository settings!**

See [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) for details.

## Links

- [Euler Protocol](https://www.euler.finance/)
- [Euler Interfaces](https://github.com/euler-xyz/euler-interfaces)
- [EVK Periphery (Deployment Repo)](https://github.com/euler-xyz/evk-periphery)
- [Ethereum Vault Connector](https://github.com/euler-xyz/ethereum-vault-connector)
- [Foundry](https://book.getfoundry.sh/)
