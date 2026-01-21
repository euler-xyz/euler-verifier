# BSC Contract Verification Report

## Summary

| Status | Count |
|--------|-------|
| ✓ Verified (exact match) | 25 |
| ✗ No exact commit found | 1 |
| ~ Standalone with diff | 0 |
| - Error | 0 |
| **Total** | **26** |

## Verified Contracts

| Contract | Address | Source Repo | Source Commit | evk-periphery | Files |
|----------|---------|-------------|---------------|---------------|-------|
| ✓ adaptiveCurveIRMFactory | [`0x6155921D...`](https://bscscan.com/address/0x6155921DaEa6a8Dca108c4B434bC66E1c51F6d6E) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`f61809fd`](https://github.com/euler-xyz/evk-periphery/tree/f61809fd) | [`f61809fd`](https://github.com/euler-xyz/evk-periphery/tree/f61809fd) | 3/6 |
| ✓ balanceTracker | [`0x2D13C46F...`](https://bscscan.com/address/0x2D13C46FE6c8B6c9ad3C5A78eD51b26733caE350) | [reward-streams](https://github.com/euler-xyz/reward-streams) | [`9eb7b8a7`](https://github.com/euler-xyz/reward-streams/tree/9eb7b8a7) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 17/17 |
| ✓ eVaultFactory | [`0x7F53E275...`](https://bscscan.com/address/0x7F53E2755eB3c43824E162F7F6F087832B9C9Df6) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |
| ✓ eVaultImplementation | [`0xB236413f...`](https://bscscan.com/address/0xB236413f1A8Fd4C5D5545ecAaC5e64fF686afe4e) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`422bf244`](https://github.com/euler-xyz/euler-vault-kit/tree/422bf244) | [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e) | 51/52 |
| ✓ eulOFTAdapter | [`0x16332693...`](https://bscscan.com/address/0x1633269308F154fbECBb15F91d72D2aFA6af95B4) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`52cf03f3`](https://github.com/euler-xyz/evk-periphery/tree/52cf03f3) | [`52cf03f3`](https://github.com/euler-xyz/evk-periphery/tree/52cf03f3) | 63/63 |
| ✓ eulerEarnFactory | [`0xc456d04E...`](https://bscscan.com/address/0xc456d04E3F43597CC7E5a2AF284fF4C4AdDA0cb1) | [euler-earn](https://github.com/euler-xyz/euler-earn) | [`master`](https://github.com/euler-xyz/euler-earn/tree/master) | - | 35/35 |
| ✓ eulerEarnPublicAllocator | [`0xD5614794...`](https://bscscan.com/address/0xD561479477b03720bF485e91B76574374A646531) | [euler-earn](https://github.com/euler-xyz/euler-earn) | [`master`](https://github.com/euler-xyz/euler-earn/tree/master) | - | 14/14 |
| ✓ eulerSwapV1Factory | [`0x3e378e5E...`](https://bscscan.com/address/0x3e378e5E339DF5e0Da32964F9EEC2CDb90D28Cc7) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`eulerswap-1.0`](https://github.com/euler-xyz/euler-swap/tree/eulerswap-1.0) | - | 55/55 |
| ✓ eulerSwapV1Implementation | [`0x16BCa432...`](https://bscscan.com/address/0x16BCa43290b77409e6D1c92B929f7A09C0E4EE86) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`eulerswap-1.0`](https://github.com/euler-xyz/euler-swap/tree/eulerswap-1.0) | - | 46/46 |
| ✓ eulerSwapV1Periphery | [`0xa8826Bb2...`](https://bscscan.com/address/0xa8826Bb29f875Db4c4b482463961776390774525) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`eulerswap-1.0`](https://github.com/euler-xyz/euler-swap/tree/eulerswap-1.0) | - | 9/9 |
| ✓ eulerSwapV2Factory | [`0xA1F83E3d...`](https://bscscan.com/address/0xA1F83E3d1819C912122A1582B4B6D3d2a1E83bb7) | [euler-swap](https://github.com/euler-xyz/euler-swap) | - | [`4cc0478d`](https://github.com/euler-xyz/evk-periphery/tree/4cc0478d) | 32/57 |
| ✓ eulerSwapV2Implementation | [`0x90Cb0b67...`](https://bscscan.com/address/0x90Cb0b67f189a3D914DA00f72070531152DBc85F) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`b948f405`](https://github.com/euler-xyz/euler-swap/tree/b948f405) | [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e) | 32/54 |
| ✓ eulerSwapV2Periphery | [`0x4258A349...`](https://bscscan.com/address/0x4258A34923CccFa29948881Cf6Aa8FdAD6338485) | [euler-swap](https://github.com/euler-xyz/euler-swap) | - | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 9/11 |
| ✓ eulerSwapV2ProtocolFeeConfig | [`0x71dFB713...`](https://bscscan.com/address/0x71dFB7138192B19CDc73487212bf6BB1Ffe3b9A1) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) | [`master`](https://github.com/euler-xyz/evk-periphery) | 2/5 |
| ✓ eulerSwapV2Registry | [`0xBc0f4dd9...`](https://bscscan.com/address/0xBc0f4dd9B5A10b15e6fA65e939Dbb1f98E7B08B7) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`b948f405`](https://github.com/euler-xyz/euler-swap/tree/b948f405) | [`6f743f86`](https://github.com/euler-xyz/evk-periphery/tree/6f743f86) | 35/35 |
| ✓ evc | [`0xb2E5a73C...`](https://bscscan.com/address/0xb2E5a73CeE08593d1a076a2AE7A6e02925a640ea) | [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) | [`084b3228`](https://github.com/euler-xyz/ethereum-vault-connector/tree/084b3228) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 9/9 |
| ✓ feeFlowController | [`0xE7Ef8C7C...`](https://bscscan.com/address/0xE7Ef8C7CcB6aa81e366F0A0ccd89A298d9893E83) | [fee-flow](https://github.com/euler-xyz/fee-flow) | [`4a419c94`](https://github.com/euler-xyz/fee-flow/tree/4a419c94) | [`d471eaaa`](https://github.com/euler-xyz/evk-periphery/tree/d471eaaa) | 5/6 |
| ✓ fixedCyclicalBinaryIRMFactory | [`0x5151a812...`](https://bscscan.com/address/0x5151a8125B91A220fFe8fEA2Ab2815b46ecaAfFb) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e) | [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e) | 3/6 |
| ✓ kinkIRMFactory | [`0x40739156...`](https://bscscan.com/address/0x40739156B75b477f5b4f2D671655492B535B59d2) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`a459e5b1`](https://github.com/euler-xyz/evk-periphery/tree/a459e5b1) | [`a459e5b1`](https://github.com/euler-xyz/evk-periphery/tree/a459e5b1) | 6/6 |
| ✓ kinkyIRMFactory | [`0x996E67A0...`](https://bscscan.com/address/0x996E67A00D2dd4e2Ace3c507250524aC66438254) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/6 |
| ✓ oracleRouterFactory | [`0xbe83f65e...`](https://bscscan.com/address/0xbe83f65e5e898D482FfAEA251B62647c411576F1) | [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle) | [`deeffa7b`](https://github.com/euler-xyz/euler-price-oracle/tree/deeffa7b) | [`91af8e8b`](https://github.com/euler-xyz/evk-periphery/tree/91af8e8b) | 13/13 |
| ✓ protocolConfig | [`0xF524F75a...`](https://bscscan.com/address/0xF524F75ad063919B86d6c5D9242847A44337BFCe) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ rEUL | [`0x5e13d419...`](https://bscscan.com/address/0x5e13d41913aDF18bb2acAe34228E8D21f3c2f2Eb) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`master`](https://github.com/euler-xyz/evk-periphery/tree/master) | [`master`](https://github.com/euler-xyz/evk-periphery) | 21/21 |
| ✓ sequenceRegistry | [`0x7fD287B3...`](https://bscscan.com/address/0x7fD287B3AE3Bf2F6C9871a44b6d9de208B0ABBE5) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ swapVerifier | [`0xA8a4f96E...`](https://bscscan.com/address/0xA8a4f96EC451f39Eb95913459901f39F5E1C068B) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |
| ✗ governorAccessControlEmergencyFactory | [`0x71620376...`](https://bscscan.com/address/0x71620376630597FA901112821455814a31d39685) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | not found | - | 42/48 |


## Changes Since Deployment

This section shows what has changed in the source code between the deployment commit and current `master`.
These diffs help identify any changes made to the codebase after deployment.

### ethereum-vault-connector

#### evc

- **Deployed from:** [`084b3228`](https://github.com/euler-xyz/ethereum-vault-connector/tree/084b3228)
- **Compare to master:** [`084b3228...master`](https://github.com/euler-xyz/ethereum-vault-connector/compare/084b3228...master)
- **evk-periphery:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)

```diff
diff --git a/src/EthereumVaultConnector.sol b/src/EthereumVaultConnector.sol
index 95009da..e6bc820 100644
--- a/src/EthereumVaultConnector.sol
+++ b/src/EthereumVaultConnector.sol
@@ -27,6 +27,8 @@ contract EthereumVaultConnector is Events, Errors, TransientStorage, IEVC {
     string public constant name = "Ethereum Vault Connector";
 
     uint160 internal constant ACCOUNT_ID_OFFSET = 8;
+    address internal constant EIP_7587_PRECOMPILES = 0x0000000000000000000000000000000000000100;
+    address internal constant COMMON_PREDEPLOYS = 0x4200000000000000000000000000000000000000;
     bytes32 internal constant HASHED_NAME = keccak256(bytes(name));
 
     bytes32 internal constant TYPE_HASH =
@@ -1045,7 +1047,8 @@ contract EthereumVaultConnector is Events, Errors, TransientStorage, IEVC {
     function isSignerValid(address signer) internal pure virtual returns (bool) {
         // not valid if the signer address falls into any of the precompiles/predeploys
         // addresses space (depends on the chain ID).
-        return !haveCommonOwnerInternal(signer, address(0));
+        return !haveCommonOwnerInternal(signer, address(0)) && !haveCommonOwnerInternal(signer, EIP_7587_PRECOMPILES)
+            && !haveCommonOwnerInternal(signer, COMMON_PREDEPLOYS);
     }
 
     /// @notice Computes the permit hash for a given set of parameters.

```

### euler-price-oracle

#### oracleRouterFactory

- **Deployed from:** [`deeffa7b`](https://github.com/euler-xyz/euler-price-oracle/tree/deeffa7b)
- **Compare to master:** [`deeffa7b...master`](https://github.com/euler-xyz/euler-price-oracle/compare/deeffa7b...master)
- **evk-periphery:** [`91af8e8b`](https://github.com/euler-xyz/evk-periphery/tree/91af8e8b)

_No diff available - see GitHub compare link above._

### euler-swap

#### eulerSwapV1Factory

- **Deployed from:** [`eulerswap-1.0`](https://github.com/euler-xyz/euler-swap/tree/eulerswap-1.0)
- **Compare to master:** [`eulerswap-1.0...master`](https://github.com/euler-xyz/euler-swap/compare/eulerswap-1.0...master)

```diff
diff --git a/src/EulerSwap.sol b/src/EulerSwap.sol
index 9953a0b..735bd58 100644
--- a/src/EulerSwap.sol
+++ b/src/EulerSwap.sol
@@ -1,115 +1,86 @@
-// SPDX-License-Identifier: GPL-2.0-or-later
+// SPDX-License-Identifier: BUSL-1.1
 pragma solidity ^0.8.27;
 
-import {IEulerSwapCallee} from "./interfaces/IEulerSwapCallee.sol";
+import {IERC20} from "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
 
-import {EVCUtil} from "evc/utils/EVCUtil.sol";
-import {IEVC} from "evc/interfaces/IEthereumVaultConnector.sol";
+import {IEulerSwapCallee} from "./interfaces/IEulerSwapCallee.sol";
 import {IEVault} from "evk/EVault/IEVault.sol";
 
 import {IEulerSwap} from "./interfaces/IEulerSwap.sol";
 import {UniswapHook} from "./UniswapHook.sol";
-import "./Events.sol";
 import {CtxLib} from "./libraries/CtxLib.sol";
-import {FundsLib} from "./libraries/FundsLib.sol";
-import {CurveLib} from "./libraries/CurveLib.sol";
 import {QuoteLib} from "./libraries/QuoteLib.sol";
+import {SwapLib} from "./libraries/SwapLib.sol";
 
-contract EulerSwap is IEulerSwap, EVCUtil, UniswapHook {
-    bytes32 public constant curve = bytes32("EulerSwap v1");
+contract EulerSwap is IEulerSwap, UniswapHook {
+    bytes32 public constant curve = bytes32("EulerSwap v2");
+    address public immutable managementImpl;
 
-    error Locked();
-    error AlreadyActivated();
-    error BadParam();
     error AmountTooBig();
-    error AssetsOutOfOrderOrEqual();
-
-    constructor(address evc_, address poolManager_) EVCUtil(evc_) UniswapHook(evc_, poolManager_) {
-        CtxLib.Storage storage s = CtxLib.getStorage();
 
-        s.status = 2; // can only be used via delegatecall proxy
+    constructor(address evc_, address protocolFeeConfig_, address poolManager_, address managementImpl_)
+        UniswapHook(evc_, protocolFeeConfig_, poolManager_)
+    {
+        managementImpl = managementImpl_;
     }
 
-    modifier nonReentrant() {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-
-        require(s.status == 1, Locked());
-        s.status = 2;
-        _;
-        s.status = 1;
-    }
+    /// @inheritdoc IEulerSwap
+    function activate(DynamicParams calldata, InitialState calldata) external {
+        _delegateToManagementImpl();
 
-    modifier nonReentrantView() {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-        require(s.status != 2, Locked());
+        // Uniswap hook activation
 
-        _;
+        activateHook(CtxLib.getStaticParams());
     }
 
     /// @inheritdoc IEulerSwap
-    function activate(InitialState calldata initialState) external {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-        Params memory p = CtxLib.getParams();
-
-        require(s.status == 0, AlreadyActivated());
-        s.status = 1;
-
-        // Parameter validation
-
-        require(p.fee < 1e18, BadParam());
-        require(p.priceX > 0 && p.priceY > 0, BadParam());
-        require(p.priceX <= 1e25 && p.priceY <= 1e25, BadParam());
-        require(p.concentrationX <= 1e18 && p.concentrationY <= 1e18, BadParam());
-
-        {
-            address asset0Addr = IEVault(p.vault0).asset();
-            address asset1Addr = IEVault(p.vault1).asset();
-            require(asset0Addr < asset1Addr, AssetsOutOfOrderOrEqual());
-            emit EulerSwapActivated(asset0Addr, asset1Addr);
-        }
-
-        // Initial state
-
-        s.reserve0 = initialState.currReserve0;
-        s.reserve1 = initialState.currReserve1;
-
-        require(CurveLib.verify(p, s.reserve0, s.reserve1), CurveLib.CurveViolation());
-        if (s.reserve0 != 0) require(!CurveLib.verify(p, s.reserve0 - 1, s.reserve1), CurveLib.CurveViolation());
-        if (s.reserve1 != 0) require(!CurveLib.verify(p, s.reserve0, s.reserve1 - 1), CurveLib.CurveViolation());
-
```

_Showing first 100 of 1768 lines. [View full diff on GitHub](https://github.com/euler-xyz/euler-swap/compare/eulerswap-1.0...master)_

#### eulerSwapV1Implementation

- **Deployed from:** [`eulerswap-1.0`](https://github.com/euler-xyz/euler-swap/tree/eulerswap-1.0)
- **Compare to master:** [`eulerswap-1.0...master`](https://github.com/euler-xyz/euler-swap/compare/eulerswap-1.0...master)

```diff
diff --git a/src/EulerSwap.sol b/src/EulerSwap.sol
index 9953a0b..735bd58 100644
--- a/src/EulerSwap.sol
+++ b/src/EulerSwap.sol
@@ -1,115 +1,86 @@
-// SPDX-License-Identifier: GPL-2.0-or-later
+// SPDX-License-Identifier: BUSL-1.1
 pragma solidity ^0.8.27;
 
-import {IEulerSwapCallee} from "./interfaces/IEulerSwapCallee.sol";
+import {IERC20} from "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
 
-import {EVCUtil} from "evc/utils/EVCUtil.sol";
-import {IEVC} from "evc/interfaces/IEthereumVaultConnector.sol";
+import {IEulerSwapCallee} from "./interfaces/IEulerSwapCallee.sol";
 import {IEVault} from "evk/EVault/IEVault.sol";
 
 import {IEulerSwap} from "./interfaces/IEulerSwap.sol";
 import {UniswapHook} from "./UniswapHook.sol";
-import "./Events.sol";
 import {CtxLib} from "./libraries/CtxLib.sol";
-import {FundsLib} from "./libraries/FundsLib.sol";
-import {CurveLib} from "./libraries/CurveLib.sol";
 import {QuoteLib} from "./libraries/QuoteLib.sol";
+import {SwapLib} from "./libraries/SwapLib.sol";
 
-contract EulerSwap is IEulerSwap, EVCUtil, UniswapHook {
-    bytes32 public constant curve = bytes32("EulerSwap v1");
+contract EulerSwap is IEulerSwap, UniswapHook {
+    bytes32 public constant curve = bytes32("EulerSwap v2");
+    address public immutable managementImpl;
 
-    error Locked();
-    error AlreadyActivated();
-    error BadParam();
     error AmountTooBig();
-    error AssetsOutOfOrderOrEqual();
-
-    constructor(address evc_, address poolManager_) EVCUtil(evc_) UniswapHook(evc_, poolManager_) {
-        CtxLib.Storage storage s = CtxLib.getStorage();
 
-        s.status = 2; // can only be used via delegatecall proxy
+    constructor(address evc_, address protocolFeeConfig_, address poolManager_, address managementImpl_)
+        UniswapHook(evc_, protocolFeeConfig_, poolManager_)
+    {
+        managementImpl = managementImpl_;
     }
 
-    modifier nonReentrant() {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-
-        require(s.status == 1, Locked());
-        s.status = 2;
-        _;
-        s.status = 1;
-    }
+    /// @inheritdoc IEulerSwap
+    function activate(DynamicParams calldata, InitialState calldata) external {
+        _delegateToManagementImpl();
 
-    modifier nonReentrantView() {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-        require(s.status != 2, Locked());
+        // Uniswap hook activation
 
-        _;
+        activateHook(CtxLib.getStaticParams());
     }
 
     /// @inheritdoc IEulerSwap
-    function activate(InitialState calldata initialState) external {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-        Params memory p = CtxLib.getParams();
-
-        require(s.status == 0, AlreadyActivated());
-        s.status = 1;
-
-        // Parameter validation
-
-        require(p.fee < 1e18, BadParam());
-        require(p.priceX > 0 && p.priceY > 0, BadParam());
-        require(p.priceX <= 1e25 && p.priceY <= 1e25, BadParam());
-        require(p.concentrationX <= 1e18 && p.concentrationY <= 1e18, BadParam());
-
-        {
-            address asset0Addr = IEVault(p.vault0).asset();
-            address asset1Addr = IEVault(p.vault1).asset();
-            require(asset0Addr < asset1Addr, AssetsOutOfOrderOrEqual());
-            emit EulerSwapActivated(asset0Addr, asset1Addr);
-        }
-
-        // Initial state
-
-        s.reserve0 = initialState.currReserve0;
-        s.reserve1 = initialState.currReserve1;
-
-        require(CurveLib.verify(p, s.reserve0, s.reserve1), CurveLib.CurveViolation());
-        if (s.reserve0 != 0) require(!CurveLib.verify(p, s.reserve0 - 1, s.reserve1), CurveLib.CurveViolation());
-        if (s.reserve1 != 0) require(!CurveLib.verify(p, s.reserve0, s.reserve1 - 1), CurveLib.CurveViolation());
-
```

_Showing first 100 of 1356 lines. [View full diff on GitHub](https://github.com/euler-xyz/euler-swap/compare/eulerswap-1.0...master)_

#### eulerSwapV1Periphery

- **Deployed from:** [`eulerswap-1.0`](https://github.com/euler-xyz/euler-swap/tree/eulerswap-1.0)
- **Compare to master:** [`eulerswap-1.0...master`](https://github.com/euler-xyz/euler-swap/compare/eulerswap-1.0...master)

```diff
diff --git a/src/EulerSwapPeriphery.sol b/src/EulerSwapPeriphery.sol
index 6929e94..6b440fb 100644
--- a/src/EulerSwapPeriphery.sol
+++ b/src/EulerSwapPeriphery.sol
@@ -11,6 +11,7 @@ contract EulerSwapPeriphery is IEulerSwapPeriphery {
 
     error AmountOutLessThanMin();
     error AmountInMoreThanMax();
+    error UnexpectedAmountOut();
     error DeadlineExpired();
 
     /// @inheritdoc IEulerSwapPeriphery
@@ -89,9 +89,13 @@ contract EulerSwapPeriphery is IEulerSwapPeriphery {
         uint256 amountOut,
         address receiver
     ) internal {
+        uint256 balanceBefore = IERC20(tokenOut).balanceOf(receiver);
+
         IERC20(tokenIn).safeTransferFrom(msg.sender, address(eulerSwap), amountIn);
 
         bool isAsset0In = tokenIn < tokenOut;
         (isAsset0In) ? eulerSwap.swap(0, amountOut, receiver, "") : eulerSwap.swap(amountOut, 0, receiver, "");
+
+        require(IERC20(tokenOut).balanceOf(receiver) == balanceBefore + amountOut, UnexpectedAmountOut());
     }
 }
diff --git a/src/interfaces/IEulerSwap.sol b/src/interfaces/IEulerSwap.sol
index ce71a2c..6281886 100644
--- a/src/interfaces/IEulerSwap.sol
+++ b/src/interfaces/IEulerSwap.sol
@@ -2,38 +2,64 @@
 pragma solidity >=0.8.0;
 
 interface IEulerSwap {
-    /// @dev Immutable pool parameters. Passed to the instance via proxy trailing data.
-    struct Params {
-        // Entities
-        address vault0;
-        address vault1;
+    /// @dev Constant pool parameters, loaded from trailing calldata.
+    struct StaticParams {
+        address supplyVault0;
+        address supplyVault1;
+        address borrowVault0;
+        address borrowVault1;
         address eulerAccount;
-        // Curve
+        address feeRecipient;
+    }
+
+    /// @dev Reconfigurable pool parameters, loaded from storage.
+    struct DynamicParams {
         uint112 equilibriumReserve0;
         uint112 equilibriumReserve1;
-        uint256 priceX;
-        uint256 priceY;
-        uint256 concentrationX;
-        uint256 concentrationY;
-        // Fees
-        uint256 fee;
-        uint256 protocolFee;
-        address protocolFeeRecipient;
+        uint112 minReserve0;
+        uint112 minReserve1;
+        uint80 priceX;
+        uint80 priceY;
+        uint64 concentrationX;
+        uint64 concentrationY;
+        uint64 fee0;
+        uint64 fee1;
+        uint40 expiration;
+        uint8 swapHookedOperations;
+        address swapHook;
     }
 
     /// @dev Starting configuration of pool storage.
     struct InitialState {
-        uint112 currReserve0;
-        uint112 currReserve1;
+        uint112 reserve0;
+        uint112 reserve1;
     }
 
     /// @notice Performs initial activation setup, such as approving vaults to access the
     /// EulerSwap instance's tokens, enabling vaults as collateral, setting up Uniswap
     /// hooks, etc. This should only be invoked by the factory.
-    function activate(InitialState calldata initialState) external;
+    function activate(DynamicParams calldata dynamicParams, InitialState calldata initialState) external;
+
+    /// @notice Installs or uninstalls a manager. Managers can reconfigure the dynamic EulerSwap parameters.
+    /// Only callable by the owner (eulerAccount).
+    /// @param manager Address to install/uninstall
+    /// @param installed Whether the manager should be installed or uninstalled
+    function setManager(address manager, bool installed) external;
+
+    /// @notice Addresses configured as managers. Managers can reconfigure the pool parameters.
+    /// @param manager Address to check
+    /// @return installed Whether the address is currently a manager of this pool
+    function managers(address manager) external view returns (bool installed);
 
```

_Showing first 100 of 155 lines. [View full diff on GitHub](https://github.com/euler-xyz/euler-swap/compare/eulerswap-1.0...master)_

#### eulerSwapV2Implementation

- **Deployed from:** [`b948f405`](https://github.com/euler-xyz/euler-swap/tree/b948f405)
- **Compare to master:** [`b948f405...master`](https://github.com/euler-xyz/euler-swap/compare/b948f405...master)
- **evk-periphery:** [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e)

```diff
diff --git a/src/EulerSwap.sol b/src/EulerSwap.sol
index 9953a0b..735bd58 100644
--- a/src/EulerSwap.sol
+++ b/src/EulerSwap.sol
@@ -1,115 +1,86 @@
-// SPDX-License-Identifier: GPL-2.0-or-later
+// SPDX-License-Identifier: BUSL-1.1
 pragma solidity ^0.8.27;
 
-import {IEulerSwapCallee} from "./interfaces/IEulerSwapCallee.sol";
+import {IERC20} from "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
 
-import {EVCUtil} from "evc/utils/EVCUtil.sol";
-import {IEVC} from "evc/interfaces/IEthereumVaultConnector.sol";
+import {IEulerSwapCallee} from "./interfaces/IEulerSwapCallee.sol";
 import {IEVault} from "evk/EVault/IEVault.sol";
 
 import {IEulerSwap} from "./interfaces/IEulerSwap.sol";
 import {UniswapHook} from "./UniswapHook.sol";
-import "./Events.sol";
 import {CtxLib} from "./libraries/CtxLib.sol";
-import {FundsLib} from "./libraries/FundsLib.sol";
-import {CurveLib} from "./libraries/CurveLib.sol";
 import {QuoteLib} from "./libraries/QuoteLib.sol";
+import {SwapLib} from "./libraries/SwapLib.sol";
 
-contract EulerSwap is IEulerSwap, EVCUtil, UniswapHook {
-    bytes32 public constant curve = bytes32("EulerSwap v1");
+contract EulerSwap is IEulerSwap, UniswapHook {
+    bytes32 public constant curve = bytes32("EulerSwap v2");
+    address public immutable managementImpl;
 
-    error Locked();
-    error AlreadyActivated();
-    error BadParam();
     error AmountTooBig();
-    error AssetsOutOfOrderOrEqual();
-
-    constructor(address evc_, address poolManager_) EVCUtil(evc_) UniswapHook(evc_, poolManager_) {
-        CtxLib.Storage storage s = CtxLib.getStorage();
 
-        s.status = 2; // can only be used via delegatecall proxy
+    constructor(address evc_, address protocolFeeConfig_, address poolManager_, address managementImpl_)
+        UniswapHook(evc_, protocolFeeConfig_, poolManager_)
+    {
+        managementImpl = managementImpl_;
     }
 
-    modifier nonReentrant() {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-
-        require(s.status == 1, Locked());
-        s.status = 2;
-        _;
-        s.status = 1;
-    }
+    /// @inheritdoc IEulerSwap
+    function activate(DynamicParams calldata, InitialState calldata) external {
+        _delegateToManagementImpl();
 
-    modifier nonReentrantView() {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-        require(s.status != 2, Locked());
+        // Uniswap hook activation
 
-        _;
+        activateHook(CtxLib.getStaticParams());
     }
 
     /// @inheritdoc IEulerSwap
-    function activate(InitialState calldata initialState) external {
-        CtxLib.Storage storage s = CtxLib.getStorage();
-        Params memory p = CtxLib.getParams();
-
-        require(s.status == 0, AlreadyActivated());
-        s.status = 1;
-
-        // Parameter validation
-
-        require(p.fee < 1e18, BadParam());
-        require(p.priceX > 0 && p.priceY > 0, BadParam());
-        require(p.priceX <= 1e25 && p.priceY <= 1e25, BadParam());
-        require(p.concentrationX <= 1e18 && p.concentrationY <= 1e18, BadParam());
-
-        {
-            address asset0Addr = IEVault(p.vault0).asset();
-            address asset1Addr = IEVault(p.vault1).asset();
-            require(asset0Addr < asset1Addr, AssetsOutOfOrderOrEqual());
-            emit EulerSwapActivated(asset0Addr, asset1Addr);
-        }
-
-        // Initial state
-
-        s.reserve0 = initialState.currReserve0;
-        s.reserve1 = initialState.currReserve1;
-
-        require(CurveLib.verify(p, s.reserve0, s.reserve1), CurveLib.CurveViolation());
-        if (s.reserve0 != 0) require(!CurveLib.verify(p, s.reserve0 - 1, s.reserve1), CurveLib.CurveViolation());
-        if (s.reserve1 != 0) require(!CurveLib.verify(p, s.reserve0, s.reserve1 - 1), CurveLib.CurveViolation());
-
```

_Showing first 100 of 2387 lines. [View full diff on GitHub](https://github.com/euler-xyz/euler-swap/compare/b948f405...master)_

#### eulerSwapV2ProtocolFeeConfig

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`master`](https://github.com/euler-xyz/evk-periphery/tree/master)

_No diff available - see GitHub compare link above._

#### eulerSwapV2Registry

- **Deployed from:** [`b948f405`](https://github.com/euler-xyz/euler-swap/tree/b948f405)
- **Compare to master:** [`b948f405...master`](https://github.com/euler-xyz/euler-swap/compare/b948f405...master)
- **evk-periphery:** [`6f743f86`](https://github.com/euler-xyz/evk-periphery/tree/6f743f86)

```diff
diff --git a/src/EulerSwapProtocolFeeConfig.sol b/src/EulerSwapProtocolFeeConfig.sol
index 0000000..ab9e806
--- /dev/null
+++ b/src/EulerSwapProtocolFeeConfig.sol
@@ -0,0 +1,118 @@
+// SPDX-License-Identifier: BUSL-1.1
+pragma solidity ^0.8.27;
+
+import {IEulerSwapProtocolFeeConfig} from "./interfaces/IEulerSwapProtocolFeeConfig.sol";
+import {EVCUtil} from "evc/utils/EVCUtil.sol";
+
+/// @title EulerSwapProtocolFeeConfig contract
+/// @custom:security-contact security@euler.xyz
+/// @author Euler Labs (https://www.eulerlabs.com/)
+contract EulerSwapProtocolFeeConfig is IEulerSwapProtocolFeeConfig, EVCUtil {
+    /// @dev Protocol fee admin
+    address public admin;
+
+    /// @dev Admin is not allowed to set a protocol fee larger than this
+    uint64 public constant MAX_PROTOCOL_FEE = 0.15e18;
+
+    /// @dev Destination of collected protocol fees, unless overridden
+    address public defaultRecipient;
+    /// @dev Default protocol fee, 1e18-scale
+    uint64 public defaultFee;
+
+    struct Override {
+        bool exists;
+        address recipient;
+        uint64 fee;
+    }
+
+    /// @dev EulerSwap-instance specific fee override
+    mapping(address pool => Override) public overrides;
+
+    error Unauthorized();
+    error InvalidAdminAddress();
+    error InvalidProtocolFee();
+    error InvalidProtocolFeeRecipient();
+
+    /// @notice Emitted when admin is set/changed
+    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
+    /// @notice Emitted when the default configuration is changed
+    event DefaultUpdated(address indexed oldRecipient, address indexed newRecipient, uint64 oldFee, uint64 newFee);
+    /// @notice Emitted when a per-pool override is created or changed
+    event OverrideSet(address indexed pool, address indexed recipient, uint64 fee);
+    /// @notice Emitted when a per-pool override is removed (and thus falls back to the default)
+    event OverrideRemoved(address indexed pool);
+
+    constructor(address evc, address admin_) EVCUtil(evc) {
+        _validateAdminAddress(admin_);
+
+        emit AdminUpdated(address(0), admin_);
+
+        admin = admin_;
+    }
+
+    modifier onlyAdmin() {
+        // Ensures that the caller is not an operator, controller, etc
+        _authenticateCallerWithStandardContextState(true);
+
+        require(_msgSender() == admin, Unauthorized());
+
+        _;
+    }
+
+    /// @inheritdoc IEulerSwapProtocolFeeConfig
+    function setAdmin(address newAdmin) external onlyAdmin {
+        _validateAdminAddress(newAdmin);
+
+        emit AdminUpdated(admin, newAdmin);
+
+        admin = newAdmin;
+    }
+
+    /// @inheritdoc IEulerSwapProtocolFeeConfig
+    function setDefault(address recipient, uint64 fee) external onlyAdmin {
+        require(fee <= MAX_PROTOCOL_FEE, InvalidProtocolFee());
+        require(fee == 0 || recipient != address(0), InvalidProtocolFeeRecipient());
+
+        emit DefaultUpdated(defaultRecipient, recipient, defaultFee, fee);
+
+        defaultRecipient = recipient;
+        defaultFee = fee;
+    }
+
+    /// @inheritdoc IEulerSwapProtocolFeeConfig
+    function setOverride(address pool, address recipient, uint64 fee) external onlyAdmin {
+        require(fee <= MAX_PROTOCOL_FEE, InvalidProtocolFee());
+
+        emit OverrideSet(pool, recipient, fee);
+
+        overrides[pool] = Override({exists: true, recipient: recipient, fee: fee});
+    }
+
+    /// @inheritdoc IEulerSwapProtocolFeeConfig
+    function removeOverride(address pool) external onlyAdmin {
+        emit OverrideRemoved(pool);
+
+        delete overrides[pool];
```

_Showing first 100 of 2481 lines. [View full diff on GitHub](https://github.com/euler-xyz/euler-swap/compare/b948f405...master)_

### euler-vault-kit

#### eVaultFactory

- **Deployed from:** [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e)
- **Compare to master:** [`9e3c760e...master`](https://github.com/euler-xyz/euler-vault-kit/compare/9e3c760e...master)
- **evk-periphery:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)

_No diff available - see GitHub compare link above._

#### eVaultImplementation

- **Deployed from:** [`422bf244`](https://github.com/euler-xyz/euler-vault-kit/tree/422bf244)
- **Compare to master:** [`422bf244...master`](https://github.com/euler-xyz/euler-vault-kit/compare/422bf244...master)
- **evk-periphery:** [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e)

_No diff available - see GitHub compare link above._

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

- **Deployed from:** [`f61809fd`](https://github.com/euler-xyz/evk-periphery/tree/f61809fd)
- **Compare to master:** [`f61809fd...master`](https://github.com/euler-xyz/evk-periphery/compare/f61809fd...master)

```diff
diff --git a/src/IRM/IRMAdaptiveCurve.sol b/src/IRM/IRMAdaptiveCurve.sol
index 00000000..1883b02b
--- /dev/null
+++ b/src/IRM/IRMAdaptiveCurve.sol
@@ -0,0 +1,224 @@
+// SPDX-License-Identifier: MIT
+// Copyright (c) 2023 Morpho Association
+
+pragma solidity ^0.8.0;
+
+import {IIRM} from "evk/InterestRateModels/IIRM.sol";
+import {ExpLib} from "./lib/ExpLib.sol";
+
+/// @title IRMAdaptiveCurve
+/// @custom:contact security@euler.xyz
+/// @author Euler Labs (https://www.eulerlabs.com/).
+/// @author Adapted from Morpho Labs (https://github.com/morpho-org/morpho-blue-irm/).
+/// @notice A Linear Kink IRM that adjusts the rate at target utilization based on time spent above/below it.
+/// @dev This implementation intentionally leaves variables names, units and ExpLib unchanged from original.
+/// Returned rates are extended to RAY per second to be compatible with the EVK.
+contract IRMAdaptiveCurve is IIRM {
+    /// @dev Unit for internal precision.
+    int256 internal constant WAD = 1e18;
+    /// @dev Unit for internal precision.
+    int256 internal constant YEAR = int256(365.2425 days);
+    /// @notice The name of the IRM.
+    string public constant name = "IRMAdaptiveCurve";
+    /// @notice The utilization rate targeted by the model.
+    /// @dev In WAD units.
+    int256 public immutable TARGET_UTILIZATION;
+    /// @notice The initial interest rate at target utilization.
+    /// @dev In WAD per second units.
+    /// When the IRM is initialized for a vault this is the rate at target utilization that is assigned.
+    int256 public immutable INITIAL_RATE_AT_TARGET;
+    /// @notice The minimum interest rate at target utilization that the model can adjust to.
+    /// @dev In WAD per second units.
+    int256 public immutable MIN_RATE_AT_TARGET;
+    /// @notice The maximum interest rate at target utilization that the model can adjust to.
+    /// @dev In WAD per second units.
+    int256 public immutable MAX_RATE_AT_TARGET;
+    /// @notice The steepness of the interest rate line.
+    /// @dev In WAD units.
+    int256 public immutable CURVE_STEEPNESS;
+    /// @notice The speed at which the rate at target is adjusted up or down.
+    /// @dev In WAD per second units.
+    /// For example, with `2e18 / 24 hours` the model will 2x `rateAtTarget` if the vault is fully utilized for a day.
+    int256 public immutable ADJUSTMENT_SPEED;
+
+    /// @notice Internal cached state of the interest rate model.
+    struct IRState {
+        /// @dev The current rate at target utilization.
+        uint144 rateAtTarget;
+        /// @dev The previous utilization rate of the vault.
+        int64 lastUtilization;
+        /// @dev The timestamp of the last update to the model.
+        uint48 lastUpdate;
+    }
+
+    /// @notice Get the internal cached state of a vault's irm.
+    mapping(address => IRState) internal irState;
+
+    error InvalidParams();
+
+    /// @notice Deploy IRMAdaptiveCurve.
+    /// @param _TARGET_UTILIZATION The utilization rate targeted by the interest rate model.
+    /// @param _INITIAL_RATE_AT_TARGET The initial interest rate at target utilization.
+    /// @param _MIN_RATE_AT_TARGET The minimum interest rate at target utilization that the model can adjust to.
+    /// @param _MAX_RATE_AT_TARGET The maximum interest rate at target utilization that the model can adjust to.
+    /// @param _CURVE_STEEPNESS The steepness of the interest rate line.
+    /// @param _ADJUSTMENT_SPEED The speed at which the rate at target utilization is adjusted up or down.
+    constructor(
+        int256 _TARGET_UTILIZATION,
+        int256 _INITIAL_RATE_AT_TARGET,
+        int256 _MIN_RATE_AT_TARGET,
+        int256 _MAX_RATE_AT_TARGET,
+        int256 _CURVE_STEEPNESS,
+        int256 _ADJUSTMENT_SPEED
+    ) {
+        // Validate parameters.
+        if (_TARGET_UTILIZATION <= 0 || _TARGET_UTILIZATION > 1e18) {
+            revert InvalidParams();
+        }
+        if (_INITIAL_RATE_AT_TARGET < _MIN_RATE_AT_TARGET || _INITIAL_RATE_AT_TARGET > _MAX_RATE_AT_TARGET) {
+            revert InvalidParams();
+        }
+        if (_MIN_RATE_AT_TARGET < 0.001e18 / YEAR || _MIN_RATE_AT_TARGET > 10e18 / YEAR) {
+            revert InvalidParams();
+        }
+        if (_MAX_RATE_AT_TARGET < 0.001e18 / YEAR || _MAX_RATE_AT_TARGET > 10e18 / YEAR) {
+            revert InvalidParams();
+        }
+        if (_CURVE_STEEPNESS < 1.01e18 || _CURVE_STEEPNESS > 100e18) {
+            revert InvalidParams();
+        }
+        if (_ADJUSTMENT_SPEED < 2e18 / YEAR || _ADJUSTMENT_SPEED > 1000e18 / YEAR) {
+            revert InvalidParams();
+        }
+
+        TARGET_UTILIZATION = _TARGET_UTILIZATION;
+        INITIAL_RATE_AT_TARGET = _INITIAL_RATE_AT_TARGET;
```

_Showing first 100 of 329 lines. [View full diff on GitHub](https://github.com/euler-xyz/evk-periphery/compare/f61809fd...master)_

#### fixedCyclicalBinaryIRMFactory

- **Deployed from:** [`6fee729e`](https://github.com/euler-xyz/evk-periphery/tree/6fee729e)
- **Compare to master:** [`6fee729e...master`](https://github.com/euler-xyz/evk-periphery/compare/6fee729e...master)

_No diff available - see GitHub compare link above._

#### kinkIRMFactory

- **Deployed from:** [`a459e5b1`](https://github.com/euler-xyz/evk-periphery/tree/a459e5b1)
- **Compare to master:** [`a459e5b1...master`](https://github.com/euler-xyz/evk-periphery/compare/a459e5b1...master)

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
diff --git a/src/IRMFactory/interfaces/IEulerKinkIRMFactory.sol b/src/IRMFactory/interfaces/IEulerKinkIRMFactory.sol
index 14ffd834..29f554a4 100644
--- a/src/IRMFactory/interfaces/IEulerKinkIRMFactory.sol
+++ b/src/IRMFactory/interfaces/IEulerKinkIRMFactory.sol
@@ -15,5 +15,5 @@ interface IEulerKinkIRMFactory is IFactory {
     /// @param slope2 The slope of the IRM at the second kink.
     /// @param kink The kink of the IRM.
     /// @return The deployment address.
-    function deploy(uint256 baseRate, uint256 slope1, uint256 slope2, uint256 kink) external returns (address);
+    function deploy(uint256 baseRate, uint256 slope1, uint256 slope2, uint32 kink) external returns (address);
 }

```

#### kinkyIRMFactory

- **Deployed from:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)
- **Compare to master:** [`2b087370...master`](https://github.com/euler-xyz/evk-periphery/compare/2b087370...master)

```diff
diff --git a/src/IRM/IRMLinearKinky.sol b/src/IRM/IRMLinearKinky.sol
index 00000000..f902fd25
--- /dev/null
+++ b/src/IRM/IRMLinearKinky.sol
@@ -0,0 +1,95 @@
+// SPDX-License-Identifier: GPL-2.0-or-later
+
+pragma solidity ^0.8.0;
+
+import {IIRM} from "evk/InterestRateModels/IIRM.sol";
+
+/// @title IRMLinearKinky
+/// @custom:security-contact security@euler.xyz
+/// @author Euler Labs (https://www.eulerlabs.com/)
+/// @notice Implementation of an interest rate model, where interest rate grows linearly with utilization, and spikes
+/// non-linearly after reaching kink
+contract IRMLinearKinky is IIRM {
+    /// @notice Base interest rate applied when utilization is equal zero
+    uint256 public immutable baseRate;
+    /// @notice Slope of the function before the kink
+    uint256 public immutable slope;
+    /// @notice Shape parameter for the non-linear part of the curve. Typically between 0 and 100.
+    uint256 public immutable shape;
+    /// @notice Utilization at which the slope of the interest rate function changes. In type(uint32).max scale.
+    uint256 public immutable kink;
+    /// @notice Interest rate in second percent yield (SPY) at which the interest rate function is capped
+    uint256 public immutable cutoff;
+
+    /// @notice Remaining kink helper constant.
+    uint256 internal immutable kinkRemaining;
+
+    /// @notice Creates a new linear kinky interest rate model
+    /// @param baseRate_ Base interest rate applied when utilization is equal zero
+    /// @param slope_ Slope of the function before the kink
+    /// @param shape_ Shape parameter for the non-linear part of the curve. Typically between 0 and 100
+    /// @param kink_ Utilization at which the slope of the interest rate function changes. In type(uint32).max scale
+    /// @param cutoff_ Interest rate in second percent yield (SPY) at which the interest rate function is capped
+    constructor(uint256 baseRate_, uint256 slope_, uint256 shape_, uint32 kink_, uint256 cutoff_) {
+        baseRate = baseRate_;
+        slope = slope_;
+        shape = shape_;
+        kink = kink_;
+        cutoff = cutoff_;
+        kinkRemaining = type(uint32).max - kink;
+    }
+
+    /// @inheritdoc IIRM
+    function computeInterestRate(address vault, uint256 cash, uint256 borrows)
+        external
+        view
+        override
+        returns (uint256)
+    {
+        if (msg.sender != vault) revert E_IRMUpdateUnauthorized();
+
+        return computeInterestRateInternal(vault, cash, borrows);
+    }
+
+    /// @inheritdoc IIRM
+    function computeInterestRateView(address vault, uint256 cash, uint256 borrows)
+        external
+        view
+        override
+        returns (uint256)
+    {
+        return computeInterestRateInternal(vault, cash, borrows);
+    }
+
+    function computeInterestRateInternal(address, uint256 cash, uint256 borrows) internal view returns (uint256) {
+        uint256 totalAssets = cash + borrows;
+
+        uint32 utilization = totalAssets == 0
+            ? 0 // empty pool arbitrarily given utilization of 0
+            : uint32(borrows * type(uint32).max / totalAssets);
+
+        uint256 ir = baseRate;
+
+        if (utilization <= kink) {
+            ir += utilization * slope;
+        } else {
+            ir += kink * slope;
+
+            uint256 utilizationOverKink;
+            uint256 utilizationRemaining;
+            unchecked {
+                utilizationOverKink = utilization - kink;
+                utilizationRemaining = type(uint32).max - utilization;
+            }
+
+            if (utilizationRemaining == 0) return cutoff;
+
+            uint256 slopeUtilizationOverKink = slope * utilizationOverKink;
+
+            ir += slopeUtilizationOverKink * kinkRemaining * (1 + shape) / utilizationRemaining
+                - slopeUtilizationOverKink * shape;
+        }
+
+        return ir > cutoff ? cutoff : ir;
+    }
+}
```

_Showing first 100 of 179 lines. [View full diff on GitHub](https://github.com/euler-xyz/evk-periphery/compare/2b087370...master)_

#### swapVerifier

- **Deployed from:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)
- **Compare to master:** [`2b087370...master`](https://github.com/euler-xyz/evk-periphery/compare/2b087370...master)

_No diff available - see GitHub compare link above._

#### eulOFTAdapter

- **Deployed from:** [`52cf03f3`](https://github.com/euler-xyz/evk-periphery/tree/52cf03f3)
- **Compare to master:** [`52cf03f3...master`](https://github.com/euler-xyz/evk-periphery/compare/52cf03f3...master)

```diff
diff --git a/src/ERC20/deployed/ERC20BurnableMintable.sol b/src/ERC20/deployed/ERC20BurnableMintable.sol
index 00000000..19bb8e81
--- /dev/null
+++ b/src/ERC20/deployed/ERC20BurnableMintable.sol
@@ -0,0 +1,57 @@
+// SPDX-License-Identifier: GPL-2.0-or-later
+
+pragma solidity ^0.8.0;
+
+import {AccessControlEnumerable} from "openzeppelin-contracts/access/extensions/AccessControlEnumerable.sol";
+import {ERC20, ERC20Burnable} from "openzeppelin-contracts/token/ERC20/extensions/ERC20Burnable.sol";
+import {ERC20Permit} from "openzeppelin-contracts/token/ERC20/extensions/ERC20Permit.sol";
+
+/// @title ERC20BurnableMintable
+/// @custom:security-contact security@euler.xyz
+/// @author Euler Labs (https://www.eulerlabs.com/)
+/// @notice An ERC20 token contract that allows to mint and burn tokens.
+/// @dev The main purpose of this contract token bridging. Hence, this contract allows the caller with the MINTER_ROLE
+/// to mint new tokens. In case of emergency, the caller with the REVOKE_MINTER_ROLE can revoke the MINTER_ROLE from an
+/// address.
+contract ERC20BurnableMintable is AccessControlEnumerable, ERC20Burnable, ERC20Permit {
+    /// @notice Role that allows revoking minter role from addresses
+    bytes32 public constant REVOKE_MINTER_ROLE = keccak256("REVOKE_MINTER_ROLE");
+
+    /// @notice Role that allows minting new tokens
+    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
+
+    /// @notice Number of decimals
+    uint8 internal immutable _decimals;
+
+    /// @notice Constructor for ERC20BurnableMintable
+    /// @param admin_ Address of the contract admin who will have DEFAULT_ADMIN_ROLE
+    /// @param name_ Name of the token
+    /// @param symbol_ Symbol of the token
+    /// @param decimals_ Number of decimals
+    constructor(address admin_, string memory name_, string memory symbol_, uint8 decimals_)
+        ERC20(name_, symbol_)
+        ERC20Permit(name_)
+    {
+        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
+        _decimals = decimals_;
+    }
+
+    /// @notice Revokes the minter role from an address
+    /// @param minter The address to revoke the minter role from
+    function revokeMinterRole(address minter) external onlyRole(REVOKE_MINTER_ROLE) {
+        _revokeRole(MINTER_ROLE, minter);
+    }
+
+    /// @notice Mints new tokens and assigns them to an account
+    /// @param _account The address that will receive the minted tokens
+    /// @param _amount The amount of tokens to mint
+    function mint(address _account, uint256 _amount) external virtual onlyRole(MINTER_ROLE) {
+        _mint(_account, _amount);
+    }
+
+    /// @notice Returns the number of decimals for the token
+    /// @return The number of decimals
+    function decimals() public view virtual override returns (uint8) {
+        return _decimals;
+    }
+}
diff --git a/src/OFT/MintBurnOFTAdapter.sol b/src/OFT/MintBurnOFTAdapter.sol
index 00000000..94a857c4
--- /dev/null
+++ b/src/OFT/MintBurnOFTAdapter.sol
@@ -0,0 +1,110 @@
+// SPDX-License-Identifier: MIT
+
+pragma solidity ^0.8.22;
+
+import {IERC20Metadata} from "openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
+import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
+import {OFTCore} from "layerzero/oft-evm/OFTCore.sol";
+import {ERC20BurnableMintable} from "../ERC20/deployed/ERC20BurnableMintable.sol";
+
+/// @title MintBurnOFTAdapter
+/// @custom:security-contact security@euler.xyz
+/// @author Euler Labs (https://www.eulerlabs.com/) based on
+/// https://github.com/LayerZero-Labs/devtools/blob/main/packages/oft-evm/contracts/MintBurnOFTAdapter.sol
+/// @notice A variant of the standard OFT Adapter that uses an existing ERC20's mint and burn mechanisms for cross-chain
+/// transfers.
+/// @dev Inherits from OFTCore and provides implementations for _debit and _credit functions using a mintable and
+/// burnable token.
+contract MintBurnOFTAdapter is OFTCore {
+    /// @dev The underlying ERC20 token with mint and burn functionality.
+    ERC20BurnableMintable internal immutable innerToken;
+
+    /**
+     * @notice Initializes the MintBurnOFTAdapter contract.
+     *
+     * @param _token The address of the underlying ERC20 token.
+     * @param _lzEndpoint The LayerZero endpoint address.
+     * @param _delegate The address of the delegate.
+     *
+     * @dev Calls the OFTCore constructor with the token's decimals, the endpoint, and the delegate.
+     */
+    constructor(address _token, address _lzEndpoint, address _delegate)
+        OFTCore(IERC20Metadata(_token).decimals(), _lzEndpoint, _delegate)
+        Ownable(_delegate)
```

_Showing first 100 of 178 lines. [View full diff on GitHub](https://github.com/euler-xyz/evk-periphery/compare/52cf03f3...master)_

### fee-flow

#### feeFlowController

- **Deployed from:** [`4a419c94`](https://github.com/euler-xyz/fee-flow/tree/4a419c94)
- **Compare to master:** [`4a419c94...master`](https://github.com/euler-xyz/fee-flow/compare/4a419c94...master)
- **evk-periphery:** [`d471eaaa`](https://github.com/euler-xyz/evk-periphery/tree/d471eaaa)

_No diff available - see GitHub compare link above._

### reward-streams

#### balanceTracker

- **Deployed from:** [`9eb7b8a7`](https://github.com/euler-xyz/reward-streams/tree/9eb7b8a7)
- **Compare to master:** [`9eb7b8a7...master`](https://github.com/euler-xyz/reward-streams/compare/9eb7b8a7...master)
- **evk-periphery:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)

_No diff available - see GitHub compare link above._



## Contracts Without Exact Match

These contracts could not be matched to any commit in the repository.
Showing diff between Etherscan source and current `master`:

### governorAccessControlEmergencyFactory

- **Address:** [`0x71620376630597FA901112821455814a31d39685`](https://bscscan.com/address/0x71620376630597FA901112821455814a31d39685)
- **Etherscan Name:** GovernorAccessControlEmergencyFactory
- **Source Repo:** [evk-periphery](https://github.com/euler-xyz/evk-periphery)
- **Files:** 42/48 matched against master
- **Compared against:** [`evk-periphery @ master`](https://github.com/euler-xyz/evk-periphery)

**External Dependencies (lib/):**
- `lib/euler-vault-kit` - version differences
- `lib/openzeppelin-contracts` - version differences

