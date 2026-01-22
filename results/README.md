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
| [Base](base.md) | 8453 | ⚠️ 96% | 25/26 | balanceTracker: OZ v5.0→v5.1 diff |
| [Polygon](polygon.md) | 137 | ⚠️ 93% | 13/14 | balanceTracker: OZ v5.0→v5.1 diff |
| [Linea](linea.md) | 59144 | ⚠️ 92% | 24/26 | eulerEarn: 24KB deployment mods |

### Notes on Partial Matches

- **balanceTracker**: The contract code matches but OpenZeppelin dependencies use v5.0.0 vs v5.1.0
- **eulerEarn**: Deployed with some functions commented out to fit 24KB contract size limit

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
