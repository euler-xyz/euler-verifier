# Documentation Index

This directory contains comprehensive documentation for verifying Euler protocol smart contracts.

## Quick Start

**New to verification?** Start here:
1. Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (5 min)
2. Review [FINDINGS.md](FINDINGS.md) for EVC example (10 min)
3. Reference [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) when needed

## Documentation Files

### 📋 [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
**Best for:** Quick lookups, daily use, troubleshooting
- One-page cheat sheet
- Compiler settings table
- Common mistakes
- Verification thresholds
- Example commands

### 🔍 [FINDINGS.md](FINDINGS.md)
**Best for:** Understanding the investigation process
- Complete EVC verification case study
- Ethereum mainnet results (99.7% match)
- Bytecode analysis
- Commit identification
- Specific git refs and settings

### 📖 [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md)
**Best for:** Step-by-step verification walkthrough
- Detailed investigation process
- How to find deployment commits
- Compiler settings per contract
- Acceptance criteria
- Troubleshooting guide
- Automated verification strategy

### 📘 [README.md](README.md)
**Best for:** Project overview and setup
- Installation instructions
- Network lists (15 production, 8 testing)
- Usage examples
- Project structure
- Configuration

## Key Findings Summary

### Critical Discovery
**Contracts are deployed from `evk-periphery`, NOT standalone repos!**

| Repo Type | Optimizer Runs | Use For |
|-----------|----------------|---------|
| `evk-periphery` | **20,000** | ✅ Verification |
| `ethereum-vault-connector` | 10,000 | ❌ Development only |

### EVC Verification Results
- **Address:** `0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383`
- **Commit:** `a7d3c29` (v1.0.1)
- **Match:** 99.7% ✅
- **Status:** VERIFIED

## Quick Reference Table

### Compiler Settings by Contract

| Contract | Runs | Solc | Via-IR | Script Line |
|----------|------|------|--------|-------------|
| EVC | 20k | 0.8.24 | No | 206 |
| EVault | 20k | 0.8.24 | No | 206 |
| Oracles | 20k | 0.8.24 | No | 206 |
| EulerEarn | 200 | 0.8.26 | **Yes** | 40 |
| EulerSwap | 1M | 0.8.27 | No | 41 |

### Verification Commands

```bash
# Standard contracts
forge build --evm-version cancun --optimizer-runs 20000 --force

# EulerEarn
forge build --via-ir --optimizer-runs 200 --use 0.8.26 --evm-version cancun --force

# EulerSwap
forge build --optimizer-runs 1000000 --use 0.8.27 --evm-version cancun --force
```

## Recommended Reading Order

### For First-Time Users
1. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Get oriented
2. [FINDINGS.md](FINDINGS.md) - See real example
3. Start verifying with the verifier suite

### For Deep Understanding
1. [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) - Complete process
2. [FINDINGS.md](FINDINGS.md) - Case study details
3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Handy reference

### For Troubleshooting
1. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common mistakes
2. [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) - Issues and solutions
3. [FINDINGS.md](FINDINGS.md) - What worked for EVC

## File Sizes

| File | Lines | Size | Time to Read |
|------|-------|------|--------------|
| QUICK_REFERENCE.md | ~150 | 4 KB | 5 min |
| FINDINGS.md | ~280 | 8 KB | 10 min |
| VERIFICATION_GUIDE.md | ~600 | 13 KB | 30 min |
| README.md | ~300 | 9 KB | 15 min |

## Common Questions

### Q: Where do I start?
**A:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - One page has everything you need.

### Q: How was EVC verified?
**A:** [FINDINGS.md](FINDINGS.md) - Complete case study with results.

### Q: How do I verify a contract step-by-step?
**A:** [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) - Detailed walkthrough.

### Q: What are the compiler settings?
**A:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md#compiler-settings-cheat-sheet) - Settings table.

### Q: Why 99% and not 100%?
**A:** [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md#acceptance-criteria) - Metadata always differs.

### Q: Which repo should I use?
**A:** Always `evk-periphery` for deployed contracts!

## External Resources

- [evk-periphery Repository](https://github.com/euler-xyz/evk-periphery)
- [euler-interfaces Repository](https://github.com/euler-xyz/euler-interfaces)
- [Foundry Book](https://book.getfoundry.sh/)
- [Solidity Docs](https://docs.soliditylang.org/)

## Updates and Maintenance

**Last Updated:** October 29, 2024

**Next Steps:**
- ✅ Document EVC verification process
- ✅ Create quick reference guide
- ✅ Write comprehensive verification guide
- 🔄 Update verifier to use evk-periphery
- 🔄 Verify all 15 production networks
- 🔄 Add support for other contract types

## Contributing

When adding new findings:
1. Update relevant documentation file
2. Add entry to this index
3. Update "Last Updated" date
4. Consider if QUICK_REFERENCE.md needs update

---

**Need help?** Start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
**Found an issue?** Check [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md#troubleshooting)
**Want details?** Read [FINDINGS.md](FINDINGS.md)
