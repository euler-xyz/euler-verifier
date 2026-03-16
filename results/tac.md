# Tac Contract Verification Report

## Summary

| Status | Count |
|--------|-------|
| ✓ Verified (exact match) | 24 |
| ✗ No exact commit found | 2 |
| ~ Standalone with diff | 0 |
| - Error | 0 |
| **Total** | **26** |

## Verified Contracts

| Contract | Address | Source Repo | Source Commit | evk-periphery | Files |
|----------|---------|-------------|---------------|---------------|-------|
| ✓ adaptiveCurveIRMFactory | [`0x13703f8E...`](https://explorer.tac.build/address/0x13703f8E7bAa5c99Fc9CD9EE1976dC7B562e5183) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ balanceTracker | [`0x45ff89cD...`](https://explorer.tac.build/address/0x45ff89cD0e976392703048F4A4314A2010ee64b8) | [reward-streams](https://github.com/euler-xyz/reward-streams) | [`9eb7b8a7`](https://github.com/euler-xyz/reward-streams/tree/9eb7b8a7fa31c275d688063c4abd07165b50b89f) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 17/17 |
| ✓ eulerEarnFactory | [`0x7670572a...`](https://explorer.tac.build/address/0x7670572aa76E6140400A948e7AAFAB0210a86d9f) | [euler-earn](https://github.com/euler-xyz/euler-earn) | [`773453b`](https://github.com/euler-xyz/euler-earn/tree/773453b) | - | 35/35 |
| ✓ eulerEarnPublicAllocator | [`0x4873ff8a...`](https://explorer.tac.build/address/0x4873ff8a70aA92443321Edb34a48f6aBfA7feB96) | [euler-earn](https://github.com/euler-xyz/euler-earn) | [`773453b`](https://github.com/euler-xyz/euler-earn/tree/773453b) | - | 14/14 |
| ✗ eulerSwapV1Factory | [`0x6A721609...`](https://explorer.tac.build/address/0x6A72160963a562f21387B166aF31a92D154106fb) | [euler-swap](https://github.com/euler-xyz/euler-swap) | not found | - | 22/55 |
| ✗ eulerSwapV1Implementation | [`0xDFfaC13f...`](https://explorer.tac.build/address/0xDFfaC13fC142Fc1d8E55226dB9c98f4b66371a3c) | [euler-swap](https://github.com/euler-xyz/euler-swap) | not found | - | 18/46 |
| ✓ eulerSwapV1Periphery | [`0xAF596563...`](https://explorer.tac.build/address/0xAF596563109C753b9c5e73DD596DD4bB247964cA) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`eulerswap-1.0`](https://github.com/euler-xyz/euler-swap/tree/eulerswap-1.0) | - | 9/9 |
| ✓ eulerSwapV2Factory | [`0xb0b53c1A...`](https://explorer.tac.build/address/0xb0b53c1A8046D92027B69D9f6D9C7cFC0f363933) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 57/57 |
| ✓ eulerSwapV2Implementation | [`0x32Da74f7...`](https://explorer.tac.build/address/0x32Da74f7bC1988c1c39adB561b6e9D2a6F33D404) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 54/54 |
| ✓ eulerSwapV2Periphery | [`0xD356C065...`](https://explorer.tac.build/address/0xD356C065777871B37Cb0D3C7761b8820c832BC57) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 11/11 |
| ✓ eulerSwapV2ProtocolFeeConfig | [`0xb7F14f64...`](https://explorer.tac.build/address/0xb7F14f649770fB7784A02A94946D14E80f79d660) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 5/5 |
| ✓ eulerSwapV2Registry | [`0xd3ee9112...`](https://explorer.tac.build/address/0xd3ee91128294Ca8231260891BEC6Da7d258De7B6) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 35/35 |
| ✓ eulOFTAdapter | [`0xe7c41548...`](https://explorer.tac.build/address/0xe7c415484348d14c0e6B8C18E110D72EcA17d306) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 63/63 |
| ✓ eVaultFactory | [`0x2b21621b...`](https://explorer.tac.build/address/0x2b21621b8Ef1406699a99071ce04ec14cCd50677) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |
| ✓ eVaultImplementation | [`0x1974899F...`](https://explorer.tac.build/address/0x1974899F5d6B5a1f8E63b2e8Ad60e14BAC3E7980) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`422bf244`](https://github.com/euler-xyz/euler-vault-kit/tree/422bf2447047d32aa9f4e5bab4be16ab3ea67ec2) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 52/52 |
| ✓ evc | [`0x01F594c6...`](https://explorer.tac.build/address/0x01F594c66A5561b90Bc782dD0297f294cD668b64) | [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) | [`a7d3c29e`](https://github.com/euler-xyz/ethereum-vault-connector/tree/a7d3c29ef7e4964736e47675e0588630d6afbfd7) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 9/9 |
| ✓ feeFlowController | [`0x9128754f...`](https://explorer.tac.build/address/0x9128754f3951a819528d110f3a92a2586D352463) | [fee-flow](https://github.com/euler-xyz/fee-flow) | [`4a419c94`](https://github.com/euler-xyz/fee-flow/tree/4a419c94e9cd68f65e11f07da9a69f726177cb9c) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ fixedCyclicalBinaryIRMFactory | [`0x2d4Efa10...`](https://explorer.tac.build/address/0x2d4Efa10E128FbA4209D04866D7A732E8DceE453) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ governorAccessControlEmergencyFactory | [`0x38d17d93...`](https://explorer.tac.build/address/0x38d17d931FC1b6D79142Ba00e8F8ea89952cD2AB) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 48/48 |
| ✓ kinkIRMFactory | [`0x80727c2F...`](https://explorer.tac.build/address/0x80727c2F6A2cc64D19Ca5B7614b4bf826Dd95DcC) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ kinkyIRMFactory | [`0x858F7F1F...`](https://explorer.tac.build/address/0x858F7F1FBB823eB97a300a31833DfAE7CA7Ec24A) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ oracleRouterFactory | [`0x0512F7cb...`](https://explorer.tac.build/address/0x0512F7cbc4Fd9d8BC47FfFa3aA0372bA2375158E) | [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle) | [`deeffa7b`](https://github.com/euler-xyz/euler-price-oracle/tree/deeffa7b518618202802f37865ed654070a7175f) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 13/13 |
| ✓ protocolConfig | [`0x4C3D26D7...`](https://explorer.tac.build/address/0x4C3D26D7Eb6D5AA62CFD99624ad4Ff3351E4B129) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ rEUL | [`0xCf623E50...`](https://explorer.tac.build/address/0xCf623E50430CCb55214985F9C986a5Fa50aD7686) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 21/21 |
| ✓ sequenceRegistry | [`0xF7a9F90b...`](https://explorer.tac.build/address/0xF7a9F90b5ACb4EE4Cd536940142A04522D28e0Aa) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ swapVerifier | [`0x5a8610DB...`](https://explorer.tac.build/address/0x5a8610DB17CfF800C8abEb6Da31B9bB1fF51843f) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |


## Contracts Without Exact Match

These contracts could not be matched to any commit in the repository.
Showing diff between explorer source and current `master`:

### eulerSwapV1Factory

- **Address:** [`0x6A72160963a562f21387B166aF31a92D154106fb`](https://explorer.tac.build/address/0x6A72160963a562f21387B166aF31a92D154106fb)
- **Files matching:** 22/55

```diff
--- local/src/EulerSwapFactory.sol
+++ explorer/src/EulerSwapFactory.sol
@@ -1,72 +1,210 @@
-// SPDX-License-Identifier: BUSL-1.1
+// SPDX-License-Identifier: GPL-2.0-or-later
 pragma solidity ^0.8.27;
+
+import {EnumerableSet} from "openzeppelin-contracts/utils/structs/EnumerableSet.sol";
 
 import {IEulerSwapFactory, IEulerSwap} from "./interfaces/IEulerSwapFactory.sol";
 import {EVCUtil} from "ethereum-vault-connector/utils/EVCUtil.sol";
+import {GenericFactory} from "GenericFactory/GenericFactory.sol";
 
 import {EulerSwap} from "./EulerSwap.sol";
+import {ProtocolFee} from "./utils/ProtocolFee.sol";
 import {MetaProxyDeployer} from "./utils/MetaProxyDeployer.sol";
 
 /// @title EulerSwapFactory contract
 /// @custom:security-contact EMAIL
 /// @author Euler Labs (https://www.eulerlabs.com/)
-contract EulerSwapFactory is IEulerSwapFactory, EVCUtil {
+contract EulerSwapFactory is IEulerSwapFactory, EVCUtil, ProtocolFee {
+    using EnumerableSet for EnumerableSet.AddressSet;
+
+    /// @dev Vaults must be deployed by this factory
+    address public immutable evkFactory;
     /// @dev The EulerSwap code instance that will be proxied to
     address public immutable eulerSwapImpl;
 
-    /// @dev Set of pool addresses deployed by this factory
-    mapping(address pool => bool) public deployedPools;
-
+    /// @dev Mapping from euler account to pool, if installed
+    mapping(address eulerAccount => address) internal installedPools;
+    /// @dev Set of all pool addresses
+    EnumerableSet.AddressSet internal allPools;
+    /// @dev Mapping from sorted pair of underlyings to set of pools
+    mapping(address asset0 => mapping(address asset1 => EnumerableSet.AddressSet)) internal poolMap;
+
+    event PoolDeployed(address indexed asset0, address indexed asset1, address indexed eulerAccount, address pool);
+    event PoolConfig(address indexed pool, IEulerSwap.Params params, IEulerSwap.InitialState initialState);
+    event PoolUninstalled(address indexed asset0, address indexed asset1, address indexed eulerAccount, address pool);
+
+    error InvalidQuery();
     error Unauthorized();
+    error OldOperatorStillInstalled();
     error OperatorNotInstalled();
-
-    event PoolDeployed(
-        address indexed asset0,
--- lib/v4-periphery/lib/v4-core/src/interfaces/IPoolManager.sol: NOT FOUND locally
--- lib/v4-periphery/lib/v4-core/src/types/Currency.sol: NOT FOUND locally
--- local/src/UniswapHook.sol
+++ explorer/src/UniswapHook.sol
@@ -1,4 +1,4 @@
-// SPDX-License-Identifier: BUSL-1.1
+// SPDX-License-Identifier: GPL-2.0-or-later
 pragma solidity ^0.8.27;
 
 import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
@@ -14,38 +14,40 @@
 
 import {IEVault} from "EVault/IEVault.sol";
 
-import {EulerSwapBase} from "./EulerSwapBase.sol";
 import {IEulerSwap} from "./interfaces/IEulerSwap.sol";
+import "./Events.sol";
+import {CtxLib} from "./libraries/CtxLib.sol";
 import {QuoteLib} from "./libraries/QuoteLib.sol";
-import {SwapLib} from "./libraries/SwapLib.sol";
+import {CurveLib} from "./libraries/CurveLib.sol";
+import {FundsLib} from "./libraries/FundsLib.sol";
 
-abstract contract UniswapHook is EulerSwapBase, BaseHook {
+contract UniswapHook is BaseHook {
     using SafeCast for uint256;
 
-    address public immutable protocolFeeConfig;
+    address private immutable evc;
 
     PoolKey internal _poolKey;
 
-    constructor(address evc_, address protocolFeeConfig_, address _poolManager)
-        EulerSwapBase(evc_)
-        BaseHook(IPoolManager(_poolManager))
-    {
-        protocolFeeConfig = protocolFeeConfig_;
+    error LockedHook();
+
+    constructor(address evc_, address _poolManager) BaseHook(IPoolManager(_poolManager)) {
+        evc = evc_;
     }
 
-    function activateHook(IEulerSwap.StaticParams memory sParams) internal nonReentrant {
-        if (address(poolManager) == address(0)) return;
-
+    function activateHook(IEulerSwap.Params memory p) internal {
         Hooks.validateHookPermissions(this, getHookPermissions());
 
-        address asset0Addr = IEVault(sParams.supplyVault0).asset();
... (393 more lines)
```

### eulerSwapV1Implementation

- **Address:** [`0xDFfaC13fC142Fc1d8E55226dB9c98f4b66371a3c`](https://explorer.tac.build/address/0xDFfaC13fC142Fc1d8E55226dB9c98f4b66371a3c)
- **Files matching:** 18/46

```diff
--- local/src/EulerSwap.sol
+++ explorer/src/EulerSwap.sol
@@ -1,84 +1,113 @@
-// SPDX-License-Identifier: BUSL-1.1
+// SPDX-License-Identifier: GPL-2.0-or-later
 pragma solidity ^0.8.27;
 
-import {IERC20} from "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
+import {IEulerSwapCallee} from "./interfaces/IEulerSwapCallee.sol";
 
-import {IEulerSwapCallee} from "./interfaces/IEulerSwapCallee.sol";
+import {EVCUtil} from "evc/utils/EVCUtil.sol";
+import {IEVC} from "evc/interfaces/IEthereumVaultConnector.sol";
 import {IEVault} from "EVault/IEVault.sol";
 
 import {IEulerSwap} from "./interfaces/IEulerSwap.sol";
 import {UniswapHook} from "./UniswapHook.sol";
+import "./Events.sol";
 import {CtxLib} from "./libraries/CtxLib.sol";
+import {FundsLib} from "./libraries/FundsLib.sol";
+import {CurveLib} from "./libraries/CurveLib.sol";
 import {QuoteLib} from "./libraries/QuoteLib.sol";
-import {SwapLib} from "./libraries/SwapLib.sol";
 
-contract EulerSwap is IEulerSwap, UniswapHook {
-    bytes32 public constant curve = bytes32("EulerSwap v2");
-    address public immutable managementImpl;
+contract EulerSwap is IEulerSwap, EVCUtil, UniswapHook {
+    bytes32 public constant curve = bytes32("EulerSwap v1");
 
+    error Locked();
+    error AlreadyActivated();
+    error BadParam();
     error AmountTooBig();
+    error AssetsOutOfOrderOrEqual();
 
-    constructor(address evc_, address protocolFeeConfig_, address poolManager_, address managementImpl_)
-        UniswapHook(evc_, protocolFeeConfig_, poolManager_)
-    {
-        managementImpl = managementImpl_;
+    constructor(address evc_, address poolManager_) EVCUtil(evc_) UniswapHook(evc_, poolManager_) {
+        CtxLib.Storage storage s = CtxLib.getStorage();
+
+        s.status = 2; // can only be used via delegatecall proxy
+    }
+
+    modifier nonReentrant() {
+        CtxLib.Storage storage s = CtxLib.getStorage();
+
+        require(s.status == 1, Locked());
--- lib/v4-periphery/lib/v4-core/src/interfaces/IPoolManager.sol: NOT FOUND locally
--- lib/v4-periphery/lib/v4-core/src/types/Currency.sol: NOT FOUND locally
--- local/src/UniswapHook.sol
+++ explorer/src/UniswapHook.sol
@@ -1,4 +1,4 @@
-// SPDX-License-Identifier: BUSL-1.1
+// SPDX-License-Identifier: GPL-2.0-or-later
 pragma solidity ^0.8.27;
 
 import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
@@ -14,38 +14,40 @@
 
 import {IEVault} from "EVault/IEVault.sol";
 
-import {EulerSwapBase} from "./EulerSwapBase.sol";
 import {IEulerSwap} from "./interfaces/IEulerSwap.sol";
+import "./Events.sol";
+import {CtxLib} from "./libraries/CtxLib.sol";
 import {QuoteLib} from "./libraries/QuoteLib.sol";
-import {SwapLib} from "./libraries/SwapLib.sol";
+import {CurveLib} from "./libraries/CurveLib.sol";
+import {FundsLib} from "./libraries/FundsLib.sol";
 
-abstract contract UniswapHook is EulerSwapBase, BaseHook {
+contract UniswapHook is BaseHook {
     using SafeCast for uint256;
 
-    address public immutable protocolFeeConfig;
+    address private immutable evc;
 
     PoolKey internal _poolKey;
 
-    constructor(address evc_, address protocolFeeConfig_, address _poolManager)
-        EulerSwapBase(evc_)
-        BaseHook(IPoolManager(_poolManager))
-    {
-        protocolFeeConfig = protocolFeeConfig_;
+    error LockedHook();
+
+    constructor(address evc_, address _poolManager) BaseHook(IPoolManager(_poolManager)) {
+        evc = evc_;
     }
 
-    function activateHook(IEulerSwap.StaticParams memory sParams) internal nonReentrant {
-        if (address(poolManager) == address(0)) return;
-
+    function activateHook(IEulerSwap.Params memory p) internal {
         Hooks.validateHookPermissions(this, getHookPermissions());
 
-        address asset0Addr = IEVault(sParams.supplyVault0).asset();
... (282 more lines)
```


## Changes Since Deployment

This section shows what has changed in the source code between the deployment commit and current `master`.
These diffs help identify any changes made to the codebase after deployment.

### ethereum-vault-connector

#### evc

- **Deployed from:** [`a7d3c29e`](https://github.com/euler-xyz/ethereum-vault-connector/tree/a7d3c29e)
- **Compare to master:** [`a7d3c29e...master`](https://github.com/euler-xyz/ethereum-vault-connector/compare/a7d3c29e...master)
- **evk-periphery:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)

_No diff available - see GitHub compare link above._

### euler-earn

#### eulerEarnFactory

- **Deployed from:** [`773453b`](https://github.com/euler-xyz/euler-earn/tree/773453b)
- **Compare to master:** [`773453b...master`](https://github.com/euler-xyz/euler-earn/compare/773453b...master)
- **evk-periphery:** [`773453b`](https://github.com/euler-xyz/evk-periphery/tree/773453b)

```diff
diff --git a/src/EulerEarn.sol b/src/EulerEarn.sol
index 4635a89..27c1873 100644
--- a/src/EulerEarn.sol
+++ b/src/EulerEarn.sol
@@ -17,12 +17,12 @@ import {ErrorsLib} from "./libraries/ErrorsLib.sol";
 import {EventsLib} from "./libraries/EventsLib.sol";
 import {SafeERC20Permit2Lib} from "./libraries/SafeERC20Permit2Lib.sol";
 import {UtilsLib, WAD} from "./libraries/UtilsLib.sol";
-import {SafeCast} from "../lib/openzeppelin-contracts/contracts/utils/math/SafeCast.sol";
-import {IERC20Metadata} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
+import {SafeCast} from "openzeppelin-contracts/utils/math/SafeCast.sol";
+import {IERC20Metadata} from "openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
 
-import {Context} from "../lib/openzeppelin-contracts/contracts/utils/Context.sol";
-import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
-import {Ownable2Step, Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable2Step.sol";
+import {Context} from "openzeppelin-contracts/utils/Context.sol";
+import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";
+import {Ownable2Step, Ownable} from "openzeppelin-contracts/access/Ownable2Step.sol";
 import {
     IERC20,
     IERC4626,
@@ -30,8 +30,8 @@ import {
     ERC4626,
     Math,
     SafeERC20
-} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";
-import {EVCUtil} from "../lib/ethereum-vault-connector/src/utils/EVCUtil.sol";
+} from "openzeppelin-contracts/token/ERC20/extensions/ERC4626.sol";
+import {EVCUtil} from "ethereum-vault-connector/utils/EVCUtil.sol";
 
 /// @title EulerEarn
 /// @author Forked with gratitude from Morpho Labs. Inspired by Silo Labs.
diff --git a/src/EulerEarnFactory.sol b/src/EulerEarnFactory.sol
index 758185e..e7fd335 100644
--- a/src/EulerEarnFactory.sol
+++ b/src/EulerEarnFactory.sol
@@ -10,8 +10,8 @@ import {ErrorsLib} from "./libraries/ErrorsLib.sol";
 
 import {EulerEarn} from "./EulerEarn.sol";
 
-import {Ownable, Context} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
-import {EVCUtil} from "../lib/ethereum-vault-connector/src/utils/EVCUtil.sol";
+import {Ownable, Context} from "openzeppelin-contracts/access/Ownable.sol";
+import {EVCUtil} from "ethereum-vault-connector/utils/EVCUtil.sol";
 
 /// @title EulerEarnFactory
 /// @author Forked with gratitude from Morpho Labs. Inspired by Silo Labs.
diff --git a/src/PublicAllocator.sol b/src/PublicAllocator.sol
index f71306c..9527976 100644
--- a/src/PublicAllocator.sol
+++ b/src/PublicAllocator.sol
@@ -14,8 +14,8 @@ import {IEulerEarn, MarketAllocation} from "./interfaces/IEulerEarn.sol";
 import {ErrorsLib} from "./libraries/ErrorsLib.sol";
 import {EventsLib} from "./libraries/EventsLib.sol";
 
-import {IERC4626} from "../lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
-import {EVCUtil} from "../lib/ethereum-vault-connector/src/utils/EVCUtil.sol";
+import {IERC4626} from "openzeppelin-contracts/interfaces/IERC4626.sol";
+import {EVCUtil} from "ethereum-vault-connector/utils/EVCUtil.sol";
 
 /// @title PublicAllocator
 /// @author Forked with gratitude from Morpho Labs. Inspired by Silo Labs.
diff --git a/src/interfaces/IEulerEarn.sol b/src/interfaces/IEulerEarn.sol
index 27334f2..ed18e7e 100644
--- a/src/interfaces/IEulerEarn.sol
+++ b/src/interfaces/IEulerEarn.sol
@@ -3,8 +3,8 @@ pragma solidity >=0.5.0;
 
 import {IEulerEarnFactory} from "./IEulerEarnFactory.sol";
 
-import {IERC4626} from "../../lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
-import {IERC20Permit} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Permit.sol";
+import {IERC4626} from "openzeppelin-contracts/interfaces/IERC4626.sol";
+import {IERC20Permit} from "openzeppelin-contracts/token/ERC20/extensions/IERC20Permit.sol";
 
 import {MarketConfig, PendingUint136, PendingAddress} from "../libraries/PendingLib.sol";
 
diff --git a/src/interfaces/IPublicAllocator.sol b/src/interfaces/IPublicAllocator.sol
index b222ce3..4a9067b 100644
--- a/src/interfaces/IPublicAllocator.sol
+++ b/src/interfaces/IPublicAllocator.sol
@@ -3,7 +3,7 @@ pragma solidity >=0.5.0;
 
 import {MarketAllocation} from "./IEulerEarn.sol";
 
-import {IERC4626} from "../../lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
+import {IERC4626} from "openzeppelin-contracts/interfaces/IERC4626.sol";
 
 /// @dev Max settable flow cap, such that caps can always be stored on 128 bits.
 /// @dev The actual max possible flow cap is type(uint128).max-1.
diff --git a/src/libraries/ErrorsLib.sol b/src/libraries/ErrorsLib.sol
index 300bb22..da0feca 100644
--- a/src/libraries/ErrorsLib.sol
+++ b/src/libraries/ErrorsLib.sol
@@ -1,7 +1,7 @@
 // SPDX-License-Identifier: GPL-2.0-or-later
 pragma solidity ^0.8.0;
 
-import {IERC4626} from "../../lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
```

_Showing first 100 of 132 lines. [View full diff on GitHub](https://github.com/euler-xyz/euler-earn/compare/773453b...master)_

#### eulerEarnPublicAllocator

- **Deployed from:** [`773453b`](https://github.com/euler-xyz/euler-earn/tree/773453b)
- **Compare to master:** [`773453b...master`](https://github.com/euler-xyz/euler-earn/compare/773453b...master)
- **evk-periphery:** [`773453b`](https://github.com/euler-xyz/evk-periphery/tree/773453b)

```diff
diff --git a/src/EulerEarn.sol b/src/EulerEarn.sol
index 4635a89..27c1873 100644
--- a/src/EulerEarn.sol
+++ b/src/EulerEarn.sol
@@ -17,12 +17,12 @@ import {ErrorsLib} from "./libraries/ErrorsLib.sol";
 import {EventsLib} from "./libraries/EventsLib.sol";
 import {SafeERC20Permit2Lib} from "./libraries/SafeERC20Permit2Lib.sol";
 import {UtilsLib, WAD} from "./libraries/UtilsLib.sol";
-import {SafeCast} from "../lib/openzeppelin-contracts/contracts/utils/math/SafeCast.sol";
-import {IERC20Metadata} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
+import {SafeCast} from "openzeppelin-contracts/utils/math/SafeCast.sol";
+import {IERC20Metadata} from "openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
 
-import {Context} from "../lib/openzeppelin-contracts/contracts/utils/Context.sol";
-import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
-import {Ownable2Step, Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable2Step.sol";
+import {Context} from "openzeppelin-contracts/utils/Context.sol";
+import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";
+import {Ownable2Step, Ownable} from "openzeppelin-contracts/access/Ownable2Step.sol";
 import {
     IERC20,
     IERC4626,
@@ -30,8 +30,8 @@ import {
     ERC4626,
     Math,
     SafeERC20
-} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";
-import {EVCUtil} from "../lib/ethereum-vault-connector/src/utils/EVCUtil.sol";
+} from "openzeppelin-contracts/token/ERC20/extensions/ERC4626.sol";
+import {EVCUtil} from "ethereum-vault-connector/utils/EVCUtil.sol";
 
 /// @title EulerEarn
 /// @author Forked with gratitude from Morpho Labs. Inspired by Silo Labs.
diff --git a/src/EulerEarnFactory.sol b/src/EulerEarnFactory.sol
index 758185e..e7fd335 100644
--- a/src/EulerEarnFactory.sol
+++ b/src/EulerEarnFactory.sol
@@ -10,8 +10,8 @@ import {ErrorsLib} from "./libraries/ErrorsLib.sol";
 
 import {EulerEarn} from "./EulerEarn.sol";
 
-import {Ownable, Context} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
-import {EVCUtil} from "../lib/ethereum-vault-connector/src/utils/EVCUtil.sol";
+import {Ownable, Context} from "openzeppelin-contracts/access/Ownable.sol";
+import {EVCUtil} from "ethereum-vault-connector/utils/EVCUtil.sol";
 
 /// @title EulerEarnFactory
 /// @author Forked with gratitude from Morpho Labs. Inspired by Silo Labs.
diff --git a/src/PublicAllocator.sol b/src/PublicAllocator.sol
index f71306c..9527976 100644
--- a/src/PublicAllocator.sol
+++ b/src/PublicAllocator.sol
@@ -14,8 +14,8 @@ import {IEulerEarn, MarketAllocation} from "./interfaces/IEulerEarn.sol";
 import {ErrorsLib} from "./libraries/ErrorsLib.sol";
 import {EventsLib} from "./libraries/EventsLib.sol";
 
-import {IERC4626} from "../lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
-import {EVCUtil} from "../lib/ethereum-vault-connector/src/utils/EVCUtil.sol";
+import {IERC4626} from "openzeppelin-contracts/interfaces/IERC4626.sol";
+import {EVCUtil} from "ethereum-vault-connector/utils/EVCUtil.sol";
 
 /// @title PublicAllocator
 /// @author Forked with gratitude from Morpho Labs. Inspired by Silo Labs.
diff --git a/src/interfaces/IEulerEarn.sol b/src/interfaces/IEulerEarn.sol
index 27334f2..ed18e7e 100644
--- a/src/interfaces/IEulerEarn.sol
+++ b/src/interfaces/IEulerEarn.sol
@@ -3,8 +3,8 @@ pragma solidity >=0.5.0;
 
 import {IEulerEarnFactory} from "./IEulerEarnFactory.sol";
 
-import {IERC4626} from "../../lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
-import {IERC20Permit} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Permit.sol";
+import {IERC4626} from "openzeppelin-contracts/interfaces/IERC4626.sol";
+import {IERC20Permit} from "openzeppelin-contracts/token/ERC20/extensions/IERC20Permit.sol";
 
 import {MarketConfig, PendingUint136, PendingAddress} from "../libraries/PendingLib.sol";
 
diff --git a/src/interfaces/IPublicAllocator.sol b/src/interfaces/IPublicAllocator.sol
index b222ce3..4a9067b 100644
--- a/src/interfaces/IPublicAllocator.sol
+++ b/src/interfaces/IPublicAllocator.sol
@@ -3,7 +3,7 @@ pragma solidity >=0.5.0;
 
 import {MarketAllocation} from "./IEulerEarn.sol";
 
-import {IERC4626} from "../../lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
+import {IERC4626} from "openzeppelin-contracts/interfaces/IERC4626.sol";
 
 /// @dev Max settable flow cap, such that caps can always be stored on 128 bits.
 /// @dev The actual max possible flow cap is type(uint128).max-1.
diff --git a/src/libraries/ErrorsLib.sol b/src/libraries/ErrorsLib.sol
index 300bb22..da0feca 100644
--- a/src/libraries/ErrorsLib.sol
+++ b/src/libraries/ErrorsLib.sol
@@ -1,7 +1,7 @@
 // SPDX-License-Identifier: GPL-2.0-or-later
 pragma solidity ^0.8.0;
 
-import {IERC4626} from "../../lib/openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
```

_Showing first 100 of 132 lines. [View full diff on GitHub](https://github.com/euler-xyz/euler-earn/compare/773453b...master)_

### euler-price-oracle

#### oracleRouterFactory

- **Deployed from:** [`deeffa7b`](https://github.com/euler-xyz/euler-price-oracle/tree/deeffa7b)
- **Compare to master:** [`deeffa7b...master`](https://github.com/euler-xyz/euler-price-oracle/compare/deeffa7b...master)
- **evk-periphery:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)

_No diff available - see GitHub compare link above._

### euler-swap

#### eulerSwapV2Factory

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a)

_No diff available - see GitHub compare link above._

#### eulerSwapV2Implementation

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a)

_No diff available - see GitHub compare link above._

#### eulerSwapV2Periphery

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a)

_No diff available - see GitHub compare link above._

#### eulerSwapV2ProtocolFeeConfig

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a)

_No diff available - see GitHub compare link above._

#### eulerSwapV2Registry

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a)

_No diff available - see GitHub compare link above._

### euler-vault-kit

#### eVaultFactory

- **Deployed from:** [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e)
- **Compare to master:** [`9e3c760e...master`](https://github.com/euler-xyz/euler-vault-kit/compare/9e3c760e...master)
- **evk-periphery:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)

_No diff available - see GitHub compare link above._

#### eVaultImplementation

- **Deployed from:** [`422bf244`](https://github.com/euler-xyz/euler-vault-kit/tree/422bf244)
- **Compare to master:** [`422bf244...master`](https://github.com/euler-xyz/euler-vault-kit/compare/422bf244...master)
- **evk-periphery:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)

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

- **Deployed from:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)
- **Compare to master:** [`392c7bd0...master`](https://github.com/euler-xyz/evk-periphery/compare/392c7bd0...master)

_No diff available - see GitHub compare link above._

#### eulOFTAdapter

- **Deployed from:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)
- **Compare to master:** [`392c7bd0...master`](https://github.com/euler-xyz/evk-periphery/compare/392c7bd0...master)

_No diff available - see GitHub compare link above._

#### fixedCyclicalBinaryIRMFactory

- **Deployed from:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)
- **Compare to master:** [`392c7bd0...master`](https://github.com/euler-xyz/evk-periphery/compare/392c7bd0...master)

_No diff available - see GitHub compare link above._

#### governorAccessControlEmergencyFactory

- **Deployed from:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)
- **Compare to master:** [`392c7bd0...master`](https://github.com/euler-xyz/evk-periphery/compare/392c7bd0...master)

_No diff available - see GitHub compare link above._

#### kinkIRMFactory

- **Deployed from:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)
- **Compare to master:** [`392c7bd0...master`](https://github.com/euler-xyz/evk-periphery/compare/392c7bd0...master)

_No diff available - see GitHub compare link above._

#### kinkyIRMFactory

- **Deployed from:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)
- **Compare to master:** [`392c7bd0...master`](https://github.com/euler-xyz/evk-periphery/compare/392c7bd0...master)

_No diff available - see GitHub compare link above._

#### rEUL

- **Deployed from:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)
- **Compare to master:** [`392c7bd0...master`](https://github.com/euler-xyz/evk-periphery/compare/392c7bd0...master)

_No diff available - see GitHub compare link above._

#### swapVerifier

- **Deployed from:** [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370)
- **Compare to master:** [`2b087370...master`](https://github.com/euler-xyz/evk-periphery/compare/2b087370...master)

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
- **evk-periphery:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)

_No diff available - see GitHub compare link above._

