# Euler Contract Verifier

Verifies that deployed Euler protocol contracts match their source code by finding exact deployment commits.

## Quick Start

```bash
# Install dependencies
uv sync

# Set your Etherscan API key
export ETHERSCAN_API_KEY=your_key_here

# Verify a single network
uv run python verify.py mainnet

# Verify all production networks
uv run python verify.py --all

# List available networks
uv run python verify.py --list
```

## Verification Reports

Reports are generated in `results/`. Each report shows which commit was used to deploy each contract.

### Production Networks

| Network | Chain ID | Status | Report |
|---------|----------|--------|--------|
| Mainnet | 1 | ✅ 26/26 | [mainnet.md](results/mainnet.md) |
| Arbitrum | 42161 | ✅ 26/26 | [arbitrum.md](results/arbitrum.md) |
| Base | 8453 | ✅ 26/26 | [base.md](results/base.md) |
| BSC | 56 | ✅ 26/26 | [bsc.md](results/bsc.md) |
| Avalanche | 43114 | ✅ 26/26 | [avalanche.md](results/avalanche.md) |
| Linea | 59144 | ⚠️ 25/26 | [linea.md](results/linea.md) |
| Swell | 1923 | ✅ 25/25 | [swell.md](results/swell.md) |
| Sonic | 146 | ✅ 25/25 | [sonic.md](results/sonic.md) |
| Bob | 60808 | ✅ 25/25 | [bob.md](results/bob.md) |
| Berachain | 80094 | ✅ 25/25 | [berachain.md](results/berachain.md) |
| Unichain | 130 | ✅ 25/25 | [unichain.md](results/unichain.md) |

### Testing Networks

| Network | Chain ID | Status | Report |
|---------|----------|--------|--------|
| Optimism | 10 | ✅ 17/17 | [optimism.md](results/optimism.md) |
| Gnosis | 100 | ✅ 14/14 | [gnosis.md](results/gnosis.md) |
| Polygon | 137 | ✅ 14/14 | [polygon.md](results/polygon.md) |

## CLI Options

```bash
uv run python verify.py <network>     # Verify single network
uv run python verify.py --all         # Verify all production networks
uv run python verify.py --exhaustive  # Deep search through git history
uv run python verify.py --skip-cache  # Force re-verification
uv run python verify.py --list        # List available networks
```

## How It Works

1. **Loads contract addresses** from `euler-interfaces/addresses/{chainId}/`
2. **Fetches verified source** from block explorer (Etherscan or Blockscout)
3. **Searches git history** in source repositories to find exact deployment commit
4. **Generates report** showing which commit matches each contract

## Project Structure

```
euler-verifier/
├── verify.py              # Unified verification script
├── networks.json          # Network and explorer configuration
├── verifier_lib/          # Core library
│   ├── config.py          # Network config loading
│   ├── addresses.py       # Contract address loading
│   ├── fetchers/          # Etherscan/Blockscout API
│   ├── comparator.py      # Source code comparison
│   ├── cache.py           # Verification caching
│   ├── commits.py         # Known deployment commits
│   └── report.py          # Markdown report generation
├── results/               # Verification reports
├── repos/                 # Cloned source repositories
├── euler-interfaces/      # Contract addresses (submodule)
├── cache/                 # API response cache
└── .github/workflows/     # CI automation
```

## Source Repositories

Contracts are deployed from these repositories:

- [evk-periphery](https://github.com/euler-xyz/evk-periphery) - Main deployment repo
- [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) - EVC
- [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) - EVault
- [euler-earn](https://github.com/euler-xyz/euler-earn) - Euler Earn vaults
- [euler-swap](https://github.com/euler-xyz/euler-swap) - EulerSwap AMM

## Requirements

- Python 3.10+
- [uv](https://github.com/astral-sh/uv) package manager
- Etherscan API key (set `ETHERSCAN_API_KEY` env var)
