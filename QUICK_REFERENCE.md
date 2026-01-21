# Quick Reference Card

## TL;DR: How to Verify Any Euler Contract

### Step 1: Identify the Contract
```bash
# Get address from euler-interfaces
cat euler-interfaces/addresses/{CHAIN_ID}/CoreAddresses.json
```

### Step 2: Use the Deployment Repo
```bash
cd repos/evk-periphery  # ⚠️ NOT the standalone repo!
```

### Step 3: Find the Deployment Commit
```bash
git log --format="%H %ai" --since="{DEPLOY_DATE - 1 day}" --until="{DEPLOY_DATE + 1 day}"
git checkout {COMMIT_HASH}
git submodule status  # Note the submodule commit
```

### Step 4: Compile with Correct Settings
```bash
cd lib/{contract-name}

# Standard contracts (EVC, EVault, Oracles):
forge build --evm-version cancun --optimizer-runs 20000 --force

# EulerEarn:
forge build --via-ir --optimizer-runs 200 --use 0.8.26 --evm-version cancun --force

# EulerSwap:
forge build --optimizer-runs 1000000 --use 0.8.27 --evm-version cancun --force
```

### Step 5: Compare
```bash
# Check function selector and bytecode length
# 99%+ match = ✅ VERIFIED
# <95% match = ❌ Wrong settings or commit
```

---

## Compiler Settings Cheat Sheet

| Contract Type | Optimizer Runs | Solc | Via-IR | Location |
|--------------|----------------|------|--------|----------|
| **EVC** | 20,000 | 0.8.24 | No | Line 206 (default) |
| **EVault** | 20,000 | 0.8.24 | No | Line 206 (default) |
| **Price Oracles** | 20,000 | 0.8.24 | No | Line 206 (default) |
| **Periphery** | 20,000 | 0.8.24 | No | Line 206 (default) |
| **EulerEarn** | 200 | 0.8.26 | **Yes** | Line 40 |
| **EulerSwap** | 1,000,000 | 0.8.27 | No | Line 41 |

*Source: `evk-periphery/script/interactiveDeployment.sh`*

---

## Common Mistakes

### ❌ Using Standalone Repo
```bash
cd ethereum-vault-connector  # WRONG!
# Settings: 10,000 runs
# Result: 7% match
```

### ✅ Using Deployment Repo
```bash
cd evk-periphery/lib/ethereum-vault-connector  # CORRECT!
# Settings: 20,000 runs
# Result: 99.7% match
```

### ❌ Wrong EVM Version
```bash
forge build  # Uses default (paris)
# Result: PUSH1 0x00 instead of PUSH0
```

### ✅ Correct EVM Version
```bash
forge build --evm-version cancun  # CORRECT!
# Result: Uses PUSH0 opcode
```

### ❌ Forgetting Via-IR
```bash
# For EulerEarn:
forge build --optimizer-runs 200  # WRONG!
```

### ✅ Using Via-IR
```bash
# For EulerEarn:
forge build --via-ir --optimizer-runs 200 --use 0.8.26  # CORRECT!
```

---

## Verification Thresholds

| Similarity | Status | Action |
|------------|--------|--------|
| **100%** | Perfect Match | ✅ Report as "Exact Match" |
| **99-99.9%** | Excellent | ✅ Report as "Verified" (metadata diff) |
| **95-99%** | Good | ⚠️ Manual review recommended |
| **90-95%** | Concerning | ⚠️ Check settings carefully |
| **<90%** | Failed | ❌ Wrong repo/commit/settings |

---

## File Locations

### Configuration
```
evk-periphery/foundry.toml              ← Deployment settings (20k runs)
evk-periphery/script/interactiveDeployment.sh  ← Deployment script
euler-interfaces/addresses/             ← Contract addresses
rpc_urls.json                           ← RPC endpoints
```

### Artifacts
```
evk-periphery/lib/{contract}/out/       ← Compiled bytecode
evk-periphery/lib/{contract}/src/       ← Source code
```

---

## Example: Verify EVC on Arbitrum

```bash
# 1. Get deployment info
NETWORK=42161
ADDRESS=$(jq -r '.evc' euler-interfaces/addresses/$NETWORK/CoreAddresses.json)
echo $ADDRESS  # 0x6302ef0F34100CDDFb5489fbcB6eE1AA95CD1066

# 2. Fetch deployment date (use RPC or explorer)
DEPLOY_DATE="2024-08-XX"  # Get from chain

# 3. Find commit
cd repos/evk-periphery
git log --since="$DEPLOY_DATE" --until="$DEPLOY_DATE" -5

# 4. Checkout and check submodule
git checkout {COMMIT}
git submodule status | grep ethereum-vault-connector

# 5. Compile
cd lib/ethereum-vault-connector
forge build --evm-version cancun --optimizer-runs 20000 --force

# 6. Compare (automated via verifier)
# Expected: 99%+ match
```

---

## Troubleshooting

### "Wrong function selector"
→ Check optimizer runs (probably using 10k instead of 20k)

### "Bytecode too small"
→ Using wrong EVM version or missing via-ir

### "Can't find contract"
→ Wrong repo or submodule not checked out correctly

### "Compilation fails"
→ Submodule commit might not compile with latest Foundry

### "7% similarity"
→ Using standalone repo instead of evk-periphery

---

## For More Details

- **Full Guide:** [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md)
- **EVC Case Study:** [FINDINGS.md](FINDINGS.md)
- **Main README:** [README.md](README.md)

---

**Last Updated:** October 29, 2024
**Tested On:** Ethereum EVC (99.7% match ✅)
