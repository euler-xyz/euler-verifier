# Euler Contract Verification Reports

This directory contains source code verification reports for Euler protocol contracts across multiple networks.

## Summary

| Network | Chain ID | Status | Verified | Report |
|---------|----------|--------|----------|--------|
| [Mainnet](mainnet.md) | 1 | ✅ 100% | 26/26 | Complete with source-repo diffs |
| [Arbitrum](arbitrum.md) | 42161 | 🔄 Pending | - | Needs re-verification |
| [Base](base.md) | 8453 | 🔄 Pending | - | Needs re-verification |
| [Optimism](optimism.md) | 10 | 🔄 Pending | - | Needs re-verification |
| [Polygon](polygon.md) | 137 | 🔄 Pending | - | Needs re-verification |
| [BSC](bsc.md) | 56 | 🔄 Pending | - | Needs re-verification |
| [Avalanche](avalanche.md) | 43114 | 🔄 Pending | - | Needs re-verification |
| [Linea](linea.md) | 59144 | 🔄 Pending | - | Needs re-verification |
| [Gnosis](gnosis.md) | 100 | 🔄 Pending | - | Needs re-verification |
| [Swell](swell.md) | 1923 | 🔄 Pending | - | Blockscout API |
| [Sonic](sonic.md) | 146 | 🔄 Pending | - | Blockscout API |
| [Bob](bob.md) | 60808 | 🔄 Pending | - | Blockscout API |
| [Berachain](berachain.md) | 80094 | 🔄 Pending | - | Blockscout API |
| [Unichain](unichain.md) | 130 | 🔄 Pending | - | Blockscout API |

## Verification Process

Each report includes:
1. **Summary** - Overall verification statistics
2. **Verified Contracts** - Table with source repos, deployment commits, and file counts
3. **Changes Since Deployment** - Git diffs showing what changed between deployment and current `master`

## Source Repositories

- [evk-periphery](https://github.com/euler-xyz/evk-periphery) - Deployment scripts and periphery contracts
- [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) - EVC core
- [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) - EVault implementation
- [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle) - Oracle adapters
- [euler-swap](https://github.com/euler-xyz/euler-swap) - EulerSwap AMM
- [euler-earn](https://github.com/euler-xyz/euler-earn) - Euler Earn vaults
- [reward-streams](https://github.com/euler-xyz/reward-streams) - Reward distribution

## Last Updated

- Mainnet: 2026-01-21
