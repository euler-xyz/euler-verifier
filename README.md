# Euler Contract Verifier

Verifies that deployed Euler protocol contracts match their source code. Finds exact deployment commits and shows what has changed since deployment.

## What It Does

1. **Finds the exact commit** - Searches through git history to find exactly which commit was used to deploy each contract
2. **Verifies source code** - Compares Etherscan-verified source against the repository
3. **Shows changes since deployment** - Generates diffs between deployment commit and current `master`

## Quick Start

```bash
# Install dependencies
uv sync

# Set your Etherscan API key
export ETHERSCAN_API_KEY=your_key_here

# Run verification for a network
uv run python verify_mainnet.py
uv run python verify_arbitrum.py
# etc.
```

## Reports

Reports are in `results/`. See [results/README.md](results/README.md) for the full summary.

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
| Unichain | 130 | ⚠️ 24/25 | [unichain.md](results/unichain.md) |

### Testing Networks

| Network | Chain ID | Status | Report |
|---------|----------|--------|--------|
| Optimism | 10 | ✅ 17/17 | [optimism.md](results/optimism.md) |
| Gnosis | 100 | ✅ 14/14 | [gnosis.md](results/gnosis.md) |
| Polygon | 137 | ✅ 14/14 | [polygon.md](results/polygon.md) |

## How It Works

Each verification script:
1. Reads contract addresses from `euler-interfaces/addresses/{chainId}/`
2. Fetches verified source code from Etherscan
3. Checks out commits in `repos/evk-periphery` (and submodules)
4. Compares source files until finding an exact match
5. Generates diff to current `master`

## Project Structure

```
euler-verifier/
├── verify_mainnet.py      # Mainnet verification script
├── verify_arbitrum.py     # Arbitrum verification script
├── verify_*.py            # Other network scripts
├── results/               # Verification reports (markdown)
├── repos/                 # Cloned source repositories
│   └── evk-periphery/     # Main deployment repo with submodules
├── euler-interfaces/      # Contract addresses (submodule)
└── cache/                 # Cached Etherscan responses
```

## Source Repositories

Contracts are deployed from [evk-periphery](https://github.com/euler-xyz/evk-periphery) which includes these as submodules:

- [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) - EVC
- [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) - EVault
- [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle) - Oracles
- [euler-swap](https://github.com/euler-xyz/euler-swap) - EulerSwap
- [euler-earn](https://github.com/euler-xyz/euler-earn) - Euler Earn

## Requirements

- Python 3.10+
- [uv](https://github.com/astral-sh/uv) package manager
- Etherscan API key (free at https://etherscan.io/apis)
