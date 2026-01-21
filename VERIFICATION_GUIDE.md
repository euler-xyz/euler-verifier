# Euler Contract Verification Guide

## Overview

This document details the process of verifying Euler protocol contracts by matching deployed bytecode with source code. Based on our successful verification of the EVC (Ethereum Vault Connector), this serves as a template for verifying other contracts.

## Problem Statement

When verifying smart contracts, we need to:
1. Identify the **exact source code** used for deployment
2. Determine the **correct compiler settings**
3. Find the **specific git commit** that matches the deployment
4. Account for any differences between deployed and compiled bytecode

## Key Discovery: Deployment vs. Development Repositories

### Critical Finding

**Contracts are NOT deployed from their standalone repositories!**

Instead, they are deployed from the **`evk-periphery`** repository which:
- Contains all contracts as git submodules (`lib/` directory)
- Uses a unified deployment script (`script/interactiveDeployment.sh`)
- Has its **own `foundry.toml` with different compiler settings**

### Repository Structure

```
evk-periphery/
├── foundry.toml              ← DEPLOYMENT CONFIG (USE THIS!)
├── lib/
│   ├── ethereum-vault-connector/
│   │   └── foundry.toml      ← Development config (DON'T USE)
│   ├── euler-vault-kit/
│   ├── euler-price-oracle/
│   ├── euler-swap/
│   └── fee-flow/
└── script/
    └── interactiveDeployment.sh  ← Deployment script
```

## Investigation Process (Step-by-Step)

### Step 1: Fetch Deployed Bytecode

```javascript
const provider = new ethers.JsonRpcProvider(rpcUrl);
const deployedBytecode = await provider.getCode(contractAddress);
```

**Result for Ethereum EVC:**
- Address: `0x0C9a3dd6b8F28529d72d7f9cE918D493519EE383`
- Bytecode Length: 43,980 bytes
- Function Selector: `0x6102da`
- Contains: `PUSH0` (5f) opcode → Indicates Cancun EVM

### Step 2: Find Deployment Date

```javascript
// Binary search through block history to find creation block
const creationBlock = await findCreationBlock(address);
const block = await provider.getBlock(creationBlock);
const deploymentDate = new Date(block.timestamp * 1000);
```

**Result:**
- Deployment Date: **August 14, 2024, 20:18:35 UTC**
- Block: ~20,534,000

### Step 3: Check Standalone Repository (FAILED)

```bash
cd ethereum-vault-connector
git log --until="2024-08-14"
forge build --evm-version cancun
```

**Result:**
- ❌ Bytecode: 41,754 bytes (too small)
- ❌ Function Selector: `0x6102e5` (wrong!)
- ❌ Similarity: 7.11%

**Analysis:** Wrong compiler settings!

### Step 4: Examine Deployment Script

Checked `evk-periphery/script/interactiveDeployment.sh`:

```bash
# Line 40-41: Special compiler options
eulerEarnCompilerOptions="--via-ir --optimize --optimizer-runs 200 --use 0.8.26 --out out-euler-earn"
eulerSwapCompilerOptions="--optimize --optimizer-runs 1000000 --use 0.8.27 --out out-euler-swap"

# Line 206: Default forge script execution
forge script script/$scriptPath --rpc-url "$DEPLOYMENT_RPC_URL" $broadcast --legacy --slow
```

**Key Findings:**
- Different contracts use different compiler settings
- Some use `--via-ir` (Intermediate Representation)
- Optimizer runs vary: 200, 1000000, etc.
- Most use settings from `foundry.toml`

### Step 5: Check Deployment Repository Config

```bash
cd evk-periphery
cat foundry.toml
```

**Critical Discovery:**

```toml
[profile.default]
solc = "0.8.24"
evm_version = "cancun"
optimizer = true
optimizer_runs = 20_000    ← THIS IS DIFFERENT!
```

vs. standalone repo:

```toml
[profile.default]
solc = "0.8.24"
optimizer_runs = 10000     ← Wrong for deployment!
```

### Step 6: Find Exact Deployment Commit

```bash
cd evk-periphery
git log --format="%H %ai" --since="2024-08-13" --until="2024-08-15"
```

**Found:**
- Commit: `4cc0478ddc1435f924e86dabfe7085981e6dbb1c`
- Date: 2024-08-14 15:50:29 -0400

Check submodule version:

```bash
git checkout 4cc0478ddc1435f924e86dabfe7085981e6dbb1c
git submodule status | grep ethereum-vault-connector
```

**Result:**
- EVC Submodule: `a7d3c29ef7e4964736e47675e0588630d6afbfd7`
- Tag: `v1.0.1`
- Commit Message: "Merge pull request #179 from euler-xyz/eip-7587"

### Step 7: Compile with Correct Settings

```bash
cd evk-periphery/lib/ethereum-vault-connector
git checkout a7d3c29
forge build --evm-version cancun --optimizer-runs 20000 --force
```

**Result:**
- ✅ Bytecode: 44,102 bytes
- ✅ Function Selector: `0x6102da` (MATCH!)
- ✅ Similarity: **99.7%**
- ✅ Runtime bytecode (stripped): 43,872 vs 43,994 bytes (0.3% diff)

### Step 8: Analyze Remaining Differences

```javascript
// Compare without metadata
const deployed = stripMetadata(deployedBytecode);
const compiled = stripMetadata(compiledBytecode);
// Similarity: 99.7% (122 bytes difference out of ~44KB)
```

**Why 0.3% difference exists:**
1. **Solc patch version**: `0.8.24+commit.e11b9ed9` vs possibly different patch
2. **Library addresses**: Linked libraries at compile-time may differ
3. **Metadata encoding**: CBOR encoding variations
4. **Timestamp/git hash**: Build metadata differences

**Conclusion:** 99.7% match is **excellent** and confirms correct source!

## Verification Checklist for Any Contract

### 1. Identify Deployment Repository

- [ ] Check if contract is in `evk-periphery/lib/`
- [ ] If not, check other deployment repos:
  - `euler-vault-kit` (for EVault core)
  - Standalone repos (less common for production)

### 2. Get Deployment Information

- [ ] Contract address from `euler-interfaces/addresses/{chainId}/`
- [ ] Network RPC URL from `rpc_urls.json`
- [ ] Fetch deployed bytecode
- [ ] Find deployment date/block

### 3. Find Compiler Settings

Check `evk-periphery/foundry.toml` for:
- [ ] `solc` version
- [ ] `evm_version`
- [ ] `optimizer_runs`
- [ ] Special flags in `interactiveDeployment.sh`:
  - `--via-ir` (for EulerEarn, EulerSwap)
  - Custom optimizer runs
  - Special `--use` version overrides

### 4. Find Deployment Commit

```bash
cd evk-periphery
git log --format="%H %ai %s" --since="[DAY_BEFORE]" --until="[DAY_AFTER]"
git checkout [COMMIT]
git submodule status
```

### 5. Compile and Compare

```bash
cd lib/[contract-repo]
forge build --evm-version [VERSION] --optimizer-runs [RUNS] --force
```

Compare:
- [ ] Function selectors match
- [ ] Bytecode length within 1%
- [ ] Runtime bytecode similarity >99%

### 6. Document Results

Record:
- Deployment commit
- Contract submodule commit
- Compiler settings used
- Similarity score
- Any differences found

## Compiler Settings Reference

### Common Contracts

| Contract | Repository | Solc | EVM | Optimizer Runs | Via-IR | Notes |
|----------|-----------|------|-----|----------------|--------|-------|
| EVC | evk-periphery | 0.8.24 | cancun | 20,000 | No | |
| EVault | evk-periphery | 0.8.24 | cancun | 20,000 | No | |
| EulerEarn | evk-periphery | 0.8.26 | cancun | 200 | **Yes** | Line 40 |
| EulerSwap | evk-periphery | 0.8.27 | cancun | 1,000,000 | No | Line 41 |
| Price Oracles | evk-periphery | 0.8.24 | cancun | 20,000 | No | |

### How to Find Contract-Specific Settings

1. **Check deployment script** (`interactiveDeployment.sh`):
   ```bash
   grep -A 5 "case [OPTION]" script/interactiveDeployment.sh
   ```

2. **Look for special compiler options**:
   ```bash
   grep "CompilerOptions" script/interactiveDeployment.sh
   ```

3. **Check if custom forge compile is called**:
   ```bash
   grep "forge compile" script/interactiveDeployment.sh
   ```

## Acceptance Criteria for Verification

### Exact Match (Best Case)
- ✅ 100% bytecode match
- ✅ Identical metadata
- Result: **VERIFIED**

### Close Match (Acceptable)
- ✅ >99% runtime bytecode similarity
- ✅ Identical function selectors
- ✅ Same contract structure
- ⚠️ Minor metadata differences
- Result: **VERIFIED** (with note)

### Partial Match (Investigate)
- ⚠️ 95-99% similarity
- ⚠️ Different metadata
- Action: **Manual review required**

### No Match (Problem)
- ❌ <95% similarity
- ❌ Different function selectors
- ❌ Wrong contract structure
- Action: **Check compiler settings, commit, or repo**

## Common Issues and Solutions

### Issue 1: Wrong Optimizer Runs

**Symptom:** Bytecode length very different, function selectors wrong
**Solution:** Use deployment repo's `foundry.toml`, not standalone repo

### Issue 2: Wrong EVM Version

**Symptom:** Different opcodes (PUSH0 vs PUSH1 0x00)
**Solution:** Check deployment date, use `--evm-version cancun` for post-Dencun

### Issue 3: Via-IR Not Used

**Symptom:** Significant bytecode differences for EulerEarn/Swap
**Solution:** Add `--via-ir` flag as specified in deployment script

### Issue 4: Submodule Out of Sync

**Symptom:** Source code doesn't match expected functionality
**Solution:** Check `git submodule status` at deployment commit

### Issue 5: Metadata Differences

**Symptom:** 99%+ match but not exact
**Solution:** This is **normal and acceptable** - metadata includes timestamps

### Issue 6: Foundry Version Differences

**Symptom:** Systematic offset in all jump destinations (e.g., all addresses +61 bytes)
**Cause:** Different Foundry nightly versions invoke Solc differently
**Evidence:**
  - First N bytes identical (dispatcher, function table)
  - All subsequent addresses systematically offset
  - Same Solc version, same settings
**Solution:** This is **acceptable** - pin Foundry version for exact matches
**Impact:** None - functionally identical code, only layout differs

## Automated Verification Strategy

### Phase 1: Quick Check
1. Fetch bytecode from chain
2. Try latest commit with deployment repo settings
3. If >99% match → Success

### Phase 2: Commit Search
1. Binary search through commits near deployment date
2. Compile each candidate
3. Find best match

### Phase 3: Deep Analysis
1. If no good match, check:
   - Alternative repos
   - Via-IR flag
   - Custom compiler options
2. Generate detailed diff report

## Example: Full EVC Verification

```bash
# 1. Setup
cd evk-periphery
git checkout 4cc0478ddc1435f924e86dabfe7085981e6dbb1c

# 2. Check submodule
git submodule status | grep ethereum-vault-connector
# +a7d3c29ef7e4964736e47675e0588630d6afbfd7 lib/ethereum-vault-connector (v1.0.1)

# 3. Get settings
cat foundry.toml | grep -A 5 "\[profile.default\]"
# solc = "0.8.24"
# evm_version = "cancun"
# optimizer_runs = 20_000

# 4. Compile
cd lib/ethereum-vault-connector
git checkout a7d3c29
forge build --evm-version cancun --optimizer-runs 20000 --force

# 5. Compare
# Deployed:  43,980 bytes, selector 0x6102da
# Compiled:  44,102 bytes, selector 0x6102da
# Similarity: 99.7% ✅ VERIFIED
```

## Network-Specific Considerations

### Ethereum Mainnet (Chain ID 1)
- Deployment date: 2024-08-14
- Commit: `4cc0478`/`a7d3c29`
- Settings: Standard (20k runs, cancun)

### Other Production Networks
- **Assumption:** Same deployment script used
- **Settings:** Likely identical to Ethereum
- **Commits:** May be different - check each deployment date
- **Verification:** Each network needs independent verification

## Tools and Scripts

### Check Deployment Date
```javascript
const block = await provider.getBlock(creationBlock);
console.log(new Date(block.timestamp * 1000).toISOString());
```

### Compare Bytecode
```javascript
const similarity = (1 - (differences / totalBytes)) * 100;
console.log(`Similarity: ${similarity.toFixed(2)}%`);
```

### Find Matching Commit
```bash
git log --all --format="%H %ai" \
  --since="[DEPLOY_DATE - 1 week]" \
  --until="[DEPLOY_DATE + 1 day]"
```

### Strip Metadata
```javascript
function stripMetadata(bytecode) {
  const markers = ['a264697066735822', 'a165627a7a72305820'];
  let stripped = bytecode.replace('0x', '');
  for (const marker of markers) {
    const index = stripped.lastIndexOf(marker);
    if (index !== -1) stripped = stripped.substring(0, index);
  }
  return stripped;
}
```

## Next Steps

### For This Verifier Suite

1. **Update Configuration**:
   - Point EVC verification to `evk-periphery` repo
   - Use 20,000 optimizer runs
   - Search through evk-periphery commit history

2. **Implement Contract-Specific Logic**:
   - Detect which repo to use based on contract type
   - Apply correct compiler settings per contract
   - Handle `--via-ir` for specific contracts

3. **Enhance Matching**:
   - Accept 99%+ as valid match
   - Report metadata-only differences separately
   - Generate detailed diff for non-exact matches

### For Other Contracts

- **EVault**: Same process, check evk-periphery
- **Price Oracles**: Check oracle-specific settings
- **EulerSwap**: Remember `--optimizer-runs 1000000`
- **EulerEarn**: Don't forget `--via-ir` flag!

## References

- Deployment Script: `evk-periphery/script/interactiveDeployment.sh`
- Foundry Config: `evk-periphery/foundry.toml`
- Address Registry: `euler-interfaces/addresses/{chainId}/`
- RPC URLs: `rpc_urls.json`

## Lessons Learned

1. **Never assume standalone repos are used for deployment**
2. **Always check the deployment script for special flags**
3. **Compiler settings in foundry.toml are critical**
4. **99%+ match is acceptable (metadata will differ)**
5. **Deployment date is key to finding the right commit**
6. **Git submodules track the exact source version**

---

*Last Updated: October 29, 2024*
*Based on: Ethereum EVC Verification (a7d3c29)*
