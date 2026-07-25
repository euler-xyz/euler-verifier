# Euler Contract Verifier

Verifies that deployed Euler protocol contracts match their source code by finding exact deployment commits.

## TypeScript engine (bytecode verification)

This is the successor verification engine (P1 of the rework). Rather than matching explorer-hosted source, it proves that a deployed contract's on-chain runtime bytecode equals `compile(repo@commit, profile)` — the artifact produced by freshly cloning the source repo at a pinned commit and building it with the recorded Solidity profile. The comparison strips the trailing CBOR metadata and masks immutable byte ranges, so the result is explorer-independent and reproducible by anyone.

Runs are driven by a manifest (`chainId` -> contract key -> `{ repo, commit, contractName, profile, waiver }`); addresses are resolved from `euler-interfaces/addresses/<chainId>/`. See `manifest.sample.json`.

```bash
pnpm install
pnpm verify --manifest manifest.sample.json --addresses ../euler-interfaces/addresses --chain 1
pnpm test              # unit tests
pnpm test:integration  # freshly clones + builds a repo and proves EVC on public RPCs (needs git + forge + network)
```

RPC endpoints follow the evk-periphery convention: `DEPLOYMENT_RPC_URL_<chainId>` (Doppler-provided in team setups — run `script/dopplerLogin.sh`, then `script/dopplerSync.sh`) overrides per chain, with public defaults in `networks.json` so most chains verify with no secrets at all. The explorer cross-check is optional and never affects the verdict: set `ETHERSCAN_API_KEY` (one Etherscan v2 key covers all etherscan_v2 chains), or per-chain `VERIFIER_URL_<chainId>` / `VERIFIER_API_KEY_<chainId>` to override. See `.env.example`.

> The Python pipeline documented below is the legacy verifier, kept until the manifest migration (P2) reaches parity with the engine.

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
| Optimism | 10 | ✅ 17/17 | [optimism.md](results/optimism.md) |
| BSC | 56 | ⚠️ 25/26 | [bsc.md](results/bsc.md) |
| Gnosis | 100 | ✅ 14/14 | [gnosis.md](results/gnosis.md) |
| Unichain | 130 | ✅ 26/26 | [unichain.md](results/unichain.md) |
| Polygon | 137 | ✅ 14/14 | [polygon.md](results/polygon.md) |
| Monad | 143 | ✅ 21/21 | [monad.md](results/monad.md) |
| Sonic | 146 | ✅ 26/26 | [sonic.md](results/sonic.md) |
| TAC | 239 | ✅ 26/26 | [tac.md](results/tac.md) |
| Swell | 1923 | ✅ 26/26 | [swell.md](results/swell.md) |
| Base | 8453 | ⚠️ 25/26 | [base.md](results/base.md) |
| Plasma | 9745 | ⚠️ 7/26 | [plasma.md](results/plasma.md) |
| Arbitrum | 42161 | ✅ 26/26 | [arbitrum.md](results/arbitrum.md) |
| Avalanche | 43114 | ✅ 26/26 | [avalanche.md](results/avalanche.md) |
| Linea | 59144 | ⚠️ 25/26 | [linea.md](results/linea.md) |
| BOB | 60808 | ✅ 26/26 | [bob.md](results/bob.md) |
| Berachain | 80094 | ✅ 26/26 | [berachain.md](results/berachain.md) |

## CLI Options

```bash
uv run python verify.py <network>     # Verify single network
uv run python verify.py --all         # Verify all production networks
uv run python verify.py --exhaustive  # Deep search through git history
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
├── standalone/            # Per-network verification scripts
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
