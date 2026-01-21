# Polygon Contract Verification Report

## Summary

| Status | Count |
|--------|-------|
| ✓ Verified (exact match) | 12 |
| ✗ No exact commit found | 2 |
| ~ Standalone with diff | 0 |
| - Error | 0 |
| **Total** | **14** |

## Verified Contracts

| Contract | Address | Source Repo | Source Commit | evk-periphery | Files |
|----------|---------|-------------|---------------|---------------|-------|
| ✓ adaptiveCurveIRMFactory | [`0x3617a713...`](https://polygonscan.com/address/0x3617a7139dEd8F243B6CD24Da7a28c3D333a44Ce) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 3/6 |
| ✓ balanceTracker | [`0x751Ab2C2...`](https://polygonscan.com/address/0x751Ab2C287159fa2fA1a1A5A0f209c3F6e83A282) | [reward-streams](https://github.com/euler-xyz/reward-streams) | [`9eb7b8a7`](https://github.com/euler-xyz/reward-streams/tree/9eb7b8a7) | [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e) | 15/17 |
| ✓ eVaultFactory | [`0x3f23552A...`](https://polygonscan.com/address/0x3f23552A0ABd8E01AFf5E8704E8A5671A80432B5) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |
| ✓ eVaultImplementation | [`0x5Ed27EFc...`](https://polygonscan.com/address/0x5Ed27EFcb2E58b0B9cD163f9ef78bA87F167b8d2) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e) | [`a11037fa`](https://github.com/euler-xyz/evk-periphery/tree/a11037fa) | 52/52 |
| ✓ eulOFTAdapter | [`0x35772771...`](https://polygonscan.com/address/0x357727718d2A9ce83B877f503f56dED39719dCb9) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e) | [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e) | 63/63 |
| ✓ evc | [`0xa1C13F5c...`](https://polygonscan.com/address/0xa1C13F5c4929521F0bf31cBE03025cb75C214DCB) | [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) | [`a7d3c29e`](https://github.com/euler-xyz/ethereum-vault-connector/tree/a7d3c29e) | [`master`](https://github.com/euler-xyz/evk-periphery) | 8/9 |
| ✓ feeFlowController | [`0x116e4de5...`](https://polygonscan.com/address/0x116e4de5E628E6beACc6ba94Faf8Cc50ACe6225a) | [fee-flow](https://github.com/euler-xyz/fee-flow) | [`4a419c94`](https://github.com/euler-xyz/fee-flow/tree/4a419c94) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 5/6 |
| ✓ kinkIRMFactory | [`0x52A52289...`](https://polygonscan.com/address/0x52A5228987bE510c7D89aD928b47C51975f99Df6) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 4/5 |
| ✓ protocolConfig | [`0x5aE64b59...`](https://polygonscan.com/address/0x5aE64b596224cdE56C852269E9b35aD25e22Af90) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ rEUL | [`0xbfB63181...`](https://polygonscan.com/address/0xbfB6318123dA1682B8bD963846C1e9608F5F3Cda) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`d5ed0643`](https://github.com/euler-xyz/evk-periphery/tree/d5ed0643) | [`d5ed0643`](https://github.com/euler-xyz/evk-periphery/tree/d5ed0643) | 16/21 |
| ✓ sequenceRegistry | [`0xA9B3Fe66...`](https://polygonscan.com/address/0xA9B3Fe66d8FdBa841a4918D32e12894E5D36BC94) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ swapVerifier | [`0xD2c4D683...`](https://polygonscan.com/address/0xD2c4D6831C6F7c2162015523b8105b972a3D2958) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`862e1d60`](https://github.com/euler-xyz/evk-periphery/tree/862e1d60) | [`862e1d60`](https://github.com/euler-xyz/evk-periphery/tree/862e1d60) | 3/3 |
| ✗ governorAccessControlEmergencyFactory | [`0xD93452A6...`](https://polygonscan.com/address/0xD93452A6456783b0d17F9cd7Dc6c67BEf433f08f) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | not found | - | 37/48 |
| ✗ oracleRouterFactory | [`0x9FCc467b...`](https://polygonscan.com/address/0x9FCc467b739871f97485570d754d6786752Db553) | [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle) | not found | - | 8/13 |


## Changes Since Deployment

This section shows what has changed in the source code between the deployment commit and current `master`.
These diffs help identify any changes made to the codebase after deployment.

### ethereum-vault-connector

#### evc

- **Deployed from:** [`a7d3c29e`](https://github.com/euler-xyz/ethereum-vault-connector/tree/a7d3c29e)
- **Compare to master:** [`a7d3c29e...master`](https://github.com/euler-xyz/ethereum-vault-connector/compare/a7d3c29e...master)
- **evk-periphery:** [`master`](https://github.com/euler-xyz/evk-periphery/tree/master)

_No diff available - see GitHub compare link above._

### euler-vault-kit

#### eVaultFactory

- **Deployed from:** [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e)
- **Compare to master:** [`9e3c760e...master`](https://github.com/euler-xyz/euler-vault-kit/compare/9e3c760e...master)
- **evk-periphery:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)

_No diff available - see GitHub compare link above._

#### eVaultImplementation

- **Deployed from:** [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e)
- **Compare to master:** [`9e3c760e...master`](https://github.com/euler-xyz/euler-vault-kit/compare/9e3c760e...master)
- **evk-periphery:** [`a11037fa`](https://github.com/euler-xyz/evk-periphery/tree/a11037fa)

```diff
diff --git a/src/EVault/modules/Governance.sol b/src/EVault/modules/Governance.sol
index 5c728ed..08c5c96 100644
--- a/src/EVault/modules/Governance.sol
+++ b/src/EVault/modules/Governance.sol
@@ -304,12 +304,6 @@ abstract contract GovernanceModule is IGovernance, BalanceUtils, BorrowUtils, LT
 
         if (!currentLTV.isRecognizedCollateral()) vaultStorage.ltvList.push(collateral);
 
-        if (!newLiquidationLTV.isZero()) {
-            // Ensure that this collateral can be priced by the configured oracle
-            (, IPriceOracle _oracle, address _unitOfAccount) = ProxyUtils.metadata();
-            _oracle.getQuote(1e18, collateral, _unitOfAccount);
-        }
-
         emit GovSetLTV(
             collateral,
             newLTV.borrowLTV.toUint16(),

```

#### protocolConfig

- **Deployed from:** [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e)
- **Compare to master:** [`9e3c760e...master`](https://github.com/euler-xyz/euler-vault-kit/compare/9e3c760e...master)
- **evk-periphery:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)

_No diff available - see GitHub compare link above._

#### sequenceRegistry

- **Deployed from:** [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e)
- **Compare to master:** [`9e3c760e...master`](https://github.com/euler-xyz/euler-vault-kit/compare/9e3c760e...master)
- **evk-periphery:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)

_No diff available - see GitHub compare link above._

### evk-periphery

#### adaptiveCurveIRMFactory

- **Deployed from:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)
- **Compare to master:** [`392c7bd0...master`](https://github.com/euler-xyz/evk-periphery/compare/392c7bd0...master)

_No diff available - see GitHub compare link above._

#### kinkIRMFactory

- **Deployed from:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)
- **Compare to master:** [`2b087370...master`](https://github.com/euler-xyz/evk-periphery/compare/2b087370...master)

```diff
diff --git a/src/IRMFactory/EulerKinkIRMFactory.sol b/src/IRMFactory/EulerKinkIRMFactory.sol
index 2b651a40..1d7b8fbf 100644
--- a/src/IRMFactory/EulerKinkIRMFactory.sol
+++ b/src/IRMFactory/EulerKinkIRMFactory.sol
@@ -4,12 +4,13 @@ pragma solidity ^0.8.0;
 
 import {BaseFactory} from "../BaseFactory/BaseFactory.sol";
 import {IRMLinearKink} from "evk/InterestRateModels/IRMLinearKink.sol";
+import {IEulerKinkIRMFactory} from "./interfaces/IEulerKinkIRMFactory.sol";
 
 /// @title EulerKinkIRMFactory
 /// @custom:security-contact security@euler.xyz
 /// @author Euler Labs (https://www.eulerlabs.com/)
 /// @notice A minimal factory for Kink IRMs.
-contract EulerKinkIRMFactory is BaseFactory {
+contract EulerKinkIRMFactory is BaseFactory, IEulerKinkIRMFactory {
     // corresponds to 1000% APY
     uint256 internal constant MAX_ALLOWED_INTEREST_RATE = 75986279153383989049;
 
@@ -22,7 +23,11 @@ contract EulerKinkIRMFactory is BaseFactory {
     /// @param slope2 Slope of the function after the kink
     /// @param kink Utilization at which the slope of the interest rate function changes. In type(uint32).max scale
     /// @return The deployment address.
-    function deploy(uint256 baseRate, uint256 slope1, uint256 slope2, uint32 kink) external returns (address) {
+    function deploy(uint256 baseRate, uint256 slope1, uint256 slope2, uint32 kink)
+        external
+        override
+        returns (address)
+    {
         IRMLinearKink irm = new IRMLinearKink(baseRate, slope1, slope2, kink);
 
         // verify if the IRM is functional

```

#### swapVerifier

- **Deployed from:** [`862e1d60`](https://github.com/euler-xyz/evk-periphery/tree/862e1d60)
- **Compare to master:** [`862e1d60...master`](https://github.com/euler-xyz/evk-periphery/compare/862e1d60...master)

```diff
diff --git a/src/Swaps/SwapVerifier.sol b/src/Swaps/SwapVerifier.sol
index 00000000..e4972629
--- /dev/null
+++ b/src/Swaps/SwapVerifier.sol
@@ -0,0 +1,53 @@
+// SPDX-License-Identifier: GPL-2.0-or-later
+
+pragma solidity ^0.8.0;
+
+import {IEVault, IERC20} from "evk/EVault/IEVault.sol";
+
+/// @title SwapVerifier
+/// @custom:security-contact security@euler.xyz
+/// @author Euler Labs (https://www.eulerlabs.com/)
+/// @notice Simple contract used to verify post swap conditions
+/// @dev This contract is the only trusted code in the EVK swap periphery
+contract SwapVerifier {
+    error SwapVerifier_skimMin();
+    error SwapVerifier_debtMax();
+    error SwapVerifier_pastDeadline();
+
+    /// @notice Verify results of a regular swap, when bought tokens are sent to the vault and skim for the buyer
+    /// @param vault The EVault to query
+    /// @param receiver Account to skim to
+    /// @param amountMin Minimum amount of assets that should be available for skim
+    /// @param deadline Timestamp after which the swap transaction is outdated
+    /// @dev Swapper contract will send bought assets to the vault in certain situations.
+    /// @dev Calling this function is then necessary to perform slippage check and claim the output for the buyer
+    function verifyAmountMinAndSkim(address vault, address receiver, uint256 amountMin, uint256 deadline) external {
+        if (deadline < block.timestamp) revert SwapVerifier_pastDeadline();
+        if (amountMin == 0) return;
+
+        uint256 cash = IEVault(vault).cash();
+        uint256 balance = IERC20(IEVault(vault).asset()).balanceOf(vault);
+
+        unchecked {
+            if (balance <= cash || balance - cash < amountMin) revert SwapVerifier_skimMin();
+        }
+
+        IEVault(vault).skim(type(uint256).max, receiver);
+    }
+
+    /// @notice Verify results of a swap and repay operation, when debt is repaid down to a requested target
+    /// @param vault The EVault to query
+    /// @param account User account to query
+    /// @param amountMax Max amount of debt that can be held by the account
+    /// @param deadline Timestamp after which the swap transaction is outdated
+    /// @dev Swapper contract will repay debt up to a requested target amount in certain situations.
+    /// @dev Calling the function is then equivalent to a slippage check.
+    function verifyDebtMax(address vault, address account, uint256 amountMax, uint256 deadline) external view {
+        if (deadline < block.timestamp) revert SwapVerifier_pastDeadline();
+        if (amountMax == type(uint256).max) return;
+
+        uint256 debt = IEVault(vault).debtOf(account);
+
+        if (debt > amountMax) revert SwapVerifier_debtMax();
+    }
+}

```

#### eulOFTAdapter

- **Deployed from:** [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e)
- **Compare to master:** [`6fee729e...master`](https://github.com/euler-xyz/evk-periphery/compare/6fee729e...master)

```diff
diff --git a/src/ERC20/deployed/ERC20BurnableMintable.sol b/src/ERC20/deployed/ERC20BurnableMintable.sol
index 82413624..19bb8e81 100644
--- a/src/ERC20/deployed/ERC20BurnableMintable.sol
+++ b/src/ERC20/deployed/ERC20BurnableMintable.sol
@@ -45,7 +45,7 @@ contract ERC20BurnableMintable is AccessControlEnumerable, ERC20Burnable, ERC20P
     /// @notice Mints new tokens and assigns them to an account
     /// @param _account The address that will receive the minted tokens
     /// @param _amount The amount of tokens to mint
-    function mint(address _account, uint256 _amount) external onlyRole(MINTER_ROLE) {
+    function mint(address _account, uint256 _amount) external virtual onlyRole(MINTER_ROLE) {
         _mint(_account, _amount);
     }
 

```

#### rEUL

- **Deployed from:** [`d5ed0643`](https://github.com/euler-xyz/evk-periphery/tree/d5ed0643)
- **Compare to master:** [`d5ed0643...master`](https://github.com/euler-xyz/evk-periphery/compare/d5ed0643...master)

_No diff available - see GitHub compare link above._

### fee-flow

#### feeFlowController

- **Deployed from:** [`4a419c94`](https://github.com/euler-xyz/fee-flow/tree/4a419c94)
- **Compare to master:** [`4a419c94...master`](https://github.com/euler-xyz/fee-flow/compare/4a419c94...master)
- **evk-periphery:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)

_No diff available - see GitHub compare link above._

### reward-streams

#### balanceTracker

- **Deployed from:** [`9eb7b8a7`](https://github.com/euler-xyz/reward-streams/tree/9eb7b8a7)
- **Compare to master:** [`9eb7b8a7...master`](https://github.com/euler-xyz/reward-streams/compare/9eb7b8a7...master)
- **evk-periphery:** [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e)

_No diff available - see GitHub compare link above._



## Contracts Without Exact Match

These contracts could not be matched to any commit in the repository.
Showing diff between Etherscan source and current `master`:

### governorAccessControlEmergencyFactory

- **Address:** [`0xD93452A6456783b0d17F9cd7Dc6c67BEf433f08f`](https://polygonscan.com/address/0xD93452A6456783b0d17F9cd7Dc6c67BEf433f08f)
- **Etherscan Name:** GovernorAccessControlEmergencyFactory
- **Source Repo:** [evk-periphery](https://github.com/euler-xyz/evk-periphery)
- **Files:** 37/48 matched against master
- **Compared against:** [`evk-periphery @ master`](https://github.com/euler-xyz/evk-periphery)

**External Dependencies (lib/):**
- `lib/ethereum-vault-connector` - version differences
- `lib/euler-vault-kit` - version differences
- `lib/openzeppelin-contracts` - version differences

### oracleRouterFactory

- **Address:** [`0x9FCc467b739871f97485570d754d6786752Db553`](https://polygonscan.com/address/0x9FCc467b739871f97485570d754d6786752Db553)
- **Etherscan Name:** EulerRouterFactory
- **Source Repo:** [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle)
- **Files:** 8/13 matched against master
- **Compared against:** [`euler-price-oracle @ master`](https://github.com/euler-xyz/euler-price-oracle)

**External Dependencies (lib/):**
- `lib/forge-std` - version differences

