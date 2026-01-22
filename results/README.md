# Euler Contract Verification Reports

## Etherscan Networks

| Network | Chain ID | Status | Contracts | Notes |
|---------|----------|--------|-----------|-------|
| [Mainnet](mainnet.md) | 1 | ✅ 100% | 26/26 | |
| [Arbitrum](arbitrum.md) | 42161 | ✅ 100% | 26/26 | |
| [BSC](bsc.md) | 56 | ✅ 100% | 26/26 | |
| [Avalanche](avalanche.md) | 43114 | ✅ 100% | 26/26 | |
| [Gnosis](gnosis.md) | 100 | ✅ 100% | 14/14 | |
| [Optimism](optimism.md) | 10 | ✅ 100% | 17/17 | |
| [Polygon](polygon.md) | 137 | ✅ 100% | 14/14 | |
| [Base](base.md) | 8453 | ✅ 100% | 26/26 | |
| [Linea](linea.md) | 59144 | ⚠️ 96% | 25/26 | eulerEarnFactory: Linea-specific 24KB mods |

### Notes on Partial Matches

- **eulerEarnFactory (Linea)**: Deployed with additional functions commented out (`setName`, `setSymbol`) beyond the standard `deployment-script` branch modifications. This is a Linea-specific deployment optimization to fit 24KB contract size limit.

## Pending Networks (Blockscout API)

These networks use Blockscout instead of Etherscan:
- Swell (1923)
- Sonic (146)
- Bob (60808)
- Berachain (80094)
- Unichain (130)

## Report Contents

Each report includes:
1. **Summary** - Verification statistics
2. **Verified Contracts** - Table with source repos, deployment commits, file counts
3. **Changes Since Deployment** - Git diffs showing code changes from deployment commit to `master`
