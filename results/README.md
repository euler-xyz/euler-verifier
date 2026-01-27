# Euler Contract Verification Reports

## Production Networks

| Network | Chain ID | Status | Contracts | Notes |
|---------|----------|--------|-----------|-------|
| [Mainnet](mainnet.md) | 1 | ✅ 100% | 26/26 | |
| [Arbitrum](arbitrum.md) | 42161 | ✅ 100% | 26/26 | |
| [Base](base.md) | 8453 | ✅ 100% | 26/26 | |
| [BSC](bsc.md) | 56 | ✅ 100% | 26/26 | |
| [Avalanche](avalanche.md) | 43114 | ✅ 100% | 26/26 | |
| [Linea](linea.md) | 59144 | ⚠️ 96% | 25/26 | eulerEarnFactory: 24KB optimizations |
| [Swell](swell.md) | 1923 | ✅ 100% | 25/25 | |
| [Sonic](sonic.md) | 146 | ✅ 100% | 25/25 | |
| [Bob](bob.md) | 60808 | ✅ 100% | 25/25 | |
| [Berachain](berachain.md) | 80094 | ✅ 100% | 25/25 | |
| [Unichain](unichain.md) | 130 | ✅ 100% | 25/25 | |

## Testing Networks

| Network | Chain ID | Status | Contracts | Notes |
|---------|----------|--------|-----------|-------|
| [Optimism](optimism.md) | 10 | ✅ 100% | 17/17 | |
| [Gnosis](gnosis.md) | 100 | ✅ 100% | 14/14 | |
| [Polygon](polygon.md) | 137 | ✅ 100% | 14/14 | |

## Notes on Partial Matches

### Linea (96%)
- **eulerEarnFactory**: Deployed with 24KB size optimizations (commented out `setName`/`setSymbol`)

## Key Commits

| Commit | Description |
|--------|-------------|
| `master` | Current mainline |
| `773453b` | euler-earn deployment commit |
| `deploy-swell` | Swell-specific balanceTracker |
| `eulerswap-1.0` | EulerSwap V1 release tag |
| `2b087370` | Core contracts deployment |

## Running Verification

```bash
# Quick verification (known commits only)
uv run python3 verify_mainnet.py

# Exhaustive search (all commits, slower but more thorough)
uv run python3 verify_mainnet.py --exhaustive
```
