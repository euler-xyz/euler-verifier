# Berachain Contract Verification Report

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
| ✓ adaptiveCurveIRMFactory | [`0xc6e28b94...`](https://berascan.com/address/0xc6e28b94737f664b0be4230bd86793B6B6ed973B) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ balanceTracker | [`0x70Fb24bD...`](https://berascan.com/address/0x70Fb24bDa46E7cFD447C64bB32180Bc746ba3A71) | [reward-streams](https://github.com/euler-xyz/reward-streams) | [`9eb7b8a7`](https://github.com/euler-xyz/reward-streams/tree/9eb7b8a7fa31c275d688063c4abd07165b50b89f) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 17/17 |
| ✓ eulerEarnFactory | [`0x9cbc3030...`](https://berascan.com/address/0x9cbc3030e6d133D1AAa148D598FD82D70263495c) | [euler-earn](https://github.com/euler-xyz/euler-earn) | [`773453b`](https://github.com/euler-xyz/euler-earn/tree/773453b) | - | 35/35 |
| ✓ eulerEarnPublicAllocator | [`0x4E7C0590...`](https://berascan.com/address/0x4E7C059099496D56e8662570426991EA63C63C85) | [euler-earn](https://github.com/euler-xyz/euler-earn) | [`773453b`](https://github.com/euler-xyz/euler-earn/tree/773453b) | - | 14/14 |
| ✗ eulerSwapV1Factory | [`0xD14c95dc...`](https://berascan.com/address/0xD14c95dc228E8851F63d9b83A0001F4D021B5DFf) | [euler-swap](https://github.com/euler-xyz/euler-swap) | not found | - | 22/55 |
| ✗ eulerSwapV1Implementation | [`0x0e05d236...`](https://berascan.com/address/0x0e05d236cb6c350935751A73e834A13111998e3c) | [euler-swap](https://github.com/euler-xyz/euler-swap) | not found | - | 18/46 |
| ✓ eulerSwapV1Periphery | [`0x46F95127...`](https://berascan.com/address/0x46F951278f52f4798542C51BfB8Df1c165199150) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`eulerswap-1.0`](https://github.com/euler-xyz/euler-swap/tree/eulerswap-1.0) | - | 9/9 |
| ✓ eulerSwapV2Factory | [`0x1A4546b9...`](https://berascan.com/address/0x1A4546b988Ee133F72b7E27a4890355b0a341554) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 57/57 |
| ✓ eulerSwapV2Implementation | [`0x9253a3EF...`](https://berascan.com/address/0x9253a3EF2cE8875b7D15Bd2bcd3a405b62a7b0E7) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 54/54 |
| ✓ eulerSwapV2Periphery | [`0x5e044DB2...`](https://berascan.com/address/0x5e044DB2Fd14fbB48334b239CfD8530C9b03150B) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 11/11 |
| ✓ eulerSwapV2ProtocolFeeConfig | [`0xAe26ca82...`](https://berascan.com/address/0xAe26ca82da91a1157E3cC0B36a9A06f539f4DF24) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 5/5 |
| ✓ eulerSwapV2Registry | [`0x8D8B81F0...`](https://berascan.com/address/0x8D8B81F0c1be01fa3636d2cD6DeF07474d75e1e9) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc988468fd56f690e6bc0e338a5be02d034) | [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a) | 35/35 |
| ✓ eulOFTAdapter | [`0xc1d31b28...`](https://berascan.com/address/0xc1d31b2812Cc920341349a717d14bAdFb1BCab11) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 63/63 |
| ✓ eVaultFactory | [`0x5C13fb43...`](https://berascan.com/address/0x5C13fb43ae9BAe8470f646ea647784534E9543AF) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |
| ✓ eVaultImplementation | [`0x402598Ac...`](https://berascan.com/address/0x402598Ac4034D24f2cB37BDb0721A67365aD19BD) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`422bf244`](https://github.com/euler-xyz/euler-vault-kit/tree/422bf2447047d32aa9f4e5bab4be16ab3ea67ec2) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 52/52 |
| ✓ evc | [`0x45334608...`](https://berascan.com/address/0x45334608ECE7B2775136bC847EB92B5D332806A9) | [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) | [`a7d3c29e`](https://github.com/euler-xyz/ethereum-vault-connector/tree/a7d3c29ef7e4964736e47675e0588630d6afbfd7) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 9/9 |
| ✓ feeFlowController | [`0x5EAe58dc...`](https://berascan.com/address/0x5EAe58dc72E4E374F32eCA2751cC38b573dd82c9) | [fee-flow](https://github.com/euler-xyz/fee-flow) | [`4a419c94`](https://github.com/euler-xyz/fee-flow/tree/4a419c94e9cd68f65e11f07da9a69f726177cb9c) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ fixedCyclicalBinaryIRMFactory | [`0x664a67B5...`](https://berascan.com/address/0x664a67B5D4e53B8A0eab1421EEe2b7097a5523d1) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ governorAccessControlEmergencyFactory | [`0x3e3eD6B4...`](https://berascan.com/address/0x3e3eD6B48B7fBD2518019CE53bbB02048E56f265) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 48/48 |
| ✓ kinkIRMFactory | [`0xeAF2a39A...`](https://berascan.com/address/0xeAF2a39A6D1A4C9b00Aca48eCE42C044A5a9628a) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ kinkyIRMFactory | [`0xE43Aa2a0...`](https://berascan.com/address/0xE43Aa2a0bee4dd4C88148e1C459ee0323d4CAf22) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ oracleRouterFactory | [`0x809aB347...`](https://berascan.com/address/0x809aB347e6ECb46714917A7796E542c86f75FbF1) | [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle) | [`deeffa7b`](https://github.com/euler-xyz/euler-price-oracle/tree/deeffa7b518618202802f37865ed654070a7175f) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 13/13 |
| ✓ protocolConfig | [`0x51432af6...`](https://berascan.com/address/0x51432af61A715DB3D0f20A3691C1E25F9A2c6B05) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ rEUL | [`0x56C44d2F...`](https://berascan.com/address/0x56C44d2F484A61ce92Fa0BCc849feB37aBfeB59C) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 21/21 |
| ✓ sequenceRegistry | [`0x0c9a75E0...`](https://berascan.com/address/0x0c9a75E05764775A0cF52bC6cbfE6Cb229bb3901) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ swapVerifier | [`0x6fFf8Ac4...`](https://berascan.com/address/0x6fFf8Ac4AB123B62FF5e92aBb9fF702DCBD6C939) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |


## Contracts Without Exact Match

These contracts could not be matched to any commit in the repository.
Showing diff between explorer source and current `master`:

### eulerSwapV1Factory

- **Address:** [`0xD14c95dc228E8851F63d9b83A0001F4D021B5DFf`](https://berascan.com/address/0xD14c95dc228E8851F63d9b83A0001F4D021B5DFf)
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
--- local/src/interfaces/IEulerSwapFactory.sol
+++ explorer/src/interfaces/IEulerSwapFactory.sol
@@ -8,32 +8,75 @@
     /// @dev The pool address is deterministically generated using CREATE2 with a salt derived from
     ///      the euler account address and provided salt parameter. This allows the pool address to be
     ///      predicted before deployment.
-    /// @param sParams Static parameters
-    /// @param dParams Dynamic parameters
+    /// @param params Core pool parameters including vaults, account, fees, and curve shape
     /// @param initialState Initial state of the pool
     /// @param salt Unique value to generate deterministic pool address
     /// @return Address of the newly deployed pool
-    function deployPool(
-        IEulerSwap.StaticParams memory sParams,
-        IEulerSwap.DynamicParams memory dParams,
-        IEulerSwap.InitialState memory initialState,
-        bytes32 salt
-    ) external returns (address);
+    function deployPool(IEulerSwap.Params memory params, IEulerSwap.InitialState memory initialState, bytes32 salt)
+        external
+        returns (address);
 
-    /// @notice Set of pools deployed by this factory.
-    /// @param pool Address to check
-    function deployedPools(address pool) external view returns (bool);
-
-    /// @notice Given a potential pool's static parameters, this function returns the creation
-    /// code that will be used to compute the pool's address.
-    function creationCode(IEulerSwap.StaticParams memory sParams) external view returns (bytes memory);
+    /// @notice Uninstalls the pool associated with the Euler account
+    /// @dev This function removes the pool from the factory's tracking and emits a PoolUninstalled event
+    /// @dev The function can only be called by the Euler account that owns the pool
+    /// @dev If no pool is installed for the caller, the function returns without any action
+    function uninstallPool() external;
 
     /// @notice Compute the address of a new EulerSwap pool with the given parameters
     /// @dev The pool address is deterministically generated using CREATE2 with a salt derived from
     ///      the euler account address and provided salt parameter. This allows the pool address to be
     ///      predicted before deployment.
-    /// @param sParams Static parameters
+    /// @param poolParams Core pool parameters including vaults, account, and fee settings
     /// @param salt Unique value to generate deterministic pool address
     /// @return Address of the newly deployed pool
-    function computePoolAddress(IEulerSwap.StaticParams memory sParams, bytes32 salt) external view returns (address);
+    function computePoolAddress(IEulerSwap.Params memory poolParams, bytes32 salt) external view returns (address);
+
+    /// @notice Returns a slice of all deployed pools
+    /// @dev Returns a subset of the pools array from start to end index
+    /// @param start The starting index of the slice (inclusive)
+    /// @param end The ending index of the slice (exclusive)
... (393 more lines)
```

### eulerSwapV1Implementation

- **Address:** [`0x0e05d236cb6c350935751A73e834A13111998e3c`](https://berascan.com/address/0x0e05d236cb6c350935751A73e834A13111998e3c)
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
--- local/src/interfaces/IEulerSwapCallee.sol
+++ explorer/src/interfaces/IEulerSwapCallee.sol
@@ -6,9 +6,5 @@
     /// is invoked on the `to` address, allowing flash-swaps (withdrawing output before
     /// sending input.
     /// @dev This callback mechanism is designed to be as similar as possible to Uniswap2.
-    /// @param sender The address that originated the swap
-    /// @param amount0 The requested output amount of token0
-    /// @param amount1 The requested output amount of token1
-    /// @param data Opaque callback data passed by swapper
     function eulerSwapCall(address sender, uint256 amount0, uint256 amount1, bytes calldata data) external;
 }
--- local/src/interfaces/IEulerSwap.sol
+++ explorer/src/interfaces/IEulerSwap.sol
@@ -2,64 +2,38 @@
 pragma solidity >=0.8.0;
 
 interface IEulerSwap {
-    /// @dev Constant pool parameters, loaded from trailing calldata.
-    struct StaticParams {
-        address supplyVault0;
-        address supplyVault1;
-        address borrowVault0;
-        address borrowVault1;
+    /// @dev Immutable pool parameters. Passed to the instance via proxy trailing data.
+    struct Params {
+        // Entities
+        address vault0;
+        address vault1;
         address eulerAccount;
-        address feeRecipient;
-    }
-
-    /// @dev Reconfigurable pool parameters, loaded from storage.
-    struct DynamicParams {
+        // Curve
         uint112 equilibriumReserve0;
         uint112 equilibriumReserve1;
-        uint112 minReserve0;
-        uint112 minReserve1;
-        uint80 priceX;
-        uint80 priceY;
-        uint64 concentrationX;
-        uint64 concentrationY;
-        uint64 fee0;
-        uint64 fee1;
-        uint40 expiration;
-        uint8 swapHookedOperations;
-        address swapHook;
+        uint256 priceX;
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

