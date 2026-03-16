# Monad Contract Verification Report

## Summary

| Status | Count |
|--------|-------|
| ✓ Verified (exact match) | 19 |
| ✗ No exact commit found | 2 |
| ~ Standalone with diff | 0 |
| - Error | 0 |
| **Total** | **21** |

## Verified Contracts

| Contract | Address | Source Repo | Source Commit | evk-periphery | Files |
|----------|---------|-------------|---------------|---------------|-------|
| ✓ adaptiveCurveIRMFactory | [`0x967803d8...`](https://monadvision.com/address/0x967803d884DF006A7150Bc3fCD416b813fbCbF4A) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ balanceTracker | [`0xa231DccE...`](https://monadvision.com/address/0xa231DccE58EA5A43E69EF351D89ea4212Ec0f30b) | [reward-streams](https://github.com/euler-xyz/reward-streams) | [`9eb7b8a7`](https://github.com/euler-xyz/reward-streams/tree/9eb7b8a7fa31c275d688063c4abd07165b50b89f) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 17/17 |
| ✓ eulerEarnFactory | [`0xF463d4Ac...`](https://monadvision.com/address/0xF463d4Acb650cc6C4E1D6cD4D0d1b0cb224094cF) | [euler-earn](https://github.com/euler-xyz/euler-earn) | [`master`](https://github.com/euler-xyz/euler-earn/tree/master) | - | 37/37 |
| ✓ eulerEarnPublicAllocator | [`0x65A66F24...`](https://monadvision.com/address/0x65A66F24a25E8CF651C9e31D296623298C80F742) | [euler-earn](https://github.com/euler-xyz/euler-earn) | [`dec63c2a`](https://github.com/euler-xyz/euler-earn/tree/dec63c2a) | - | 14/14 |
| ✗ eulerSwapV1Factory | [`0x34f8f028...`](https://monadvision.com/address/0x34f8f028c6a446a464c10a135f44fc6fb2cee1a9) | [euler-swap](https://github.com/euler-xyz/euler-swap) | not found | - | 22/55 |
| ✗ eulerSwapV1Implementation | [`0xbfd5c7bb...`](https://monadvision.com/address/0xbfd5c7bb1c208fec761284af7db6ff1f4314372c) | [euler-swap](https://github.com/euler-xyz/euler-swap) | not found | - | 18/46 |
| ✓ eulerSwapV1Periphery | [`0xd1f69cf9...`](https://monadvision.com/address/0xd1f69cf959c1a3aae7bee5ec677222d259585b27) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`98c05c5`](https://github.com/euler-xyz/euler-swap/tree/98c05c5) | - | 9/9 |
| ✓ eulOFTAdapter | [`0x831257BF...`](https://monadvision.com/address/0x831257BFa5478111d2327e08c4068ec37Ac14B81) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 63/63 |
| ✓ eVaultFactory | [`0xba4Dd672...`](https://monadvision.com/address/0xba4Dd672062dE8FeeDb665DD4410658864483f1E) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |
| ✓ eVaultImplementation | [`0xef17750D...`](https://monadvision.com/address/0xef17750D3a162E28a302E266c474ff8989d60ECD) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`422bf244`](https://github.com/euler-xyz/euler-vault-kit/tree/422bf2447047d32aa9f4e5bab4be16ab3ea67ec2) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 52/52 |
| ✓ evc | [`0x7a9324E8...`](https://monadvision.com/address/0x7a9324E8f270413fa2E458f5831226d99C7477CD) | [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) | [`a7d3c29e`](https://github.com/euler-xyz/ethereum-vault-connector/tree/a7d3c29ef7e4964736e47675e0588630d6afbfd7) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 9/9 |
| ✓ feeFlowController | [`0x9527062A...`](https://monadvision.com/address/0x9527062A472666410DC7193A966709105dF2f147) | [fee-flow](https://github.com/euler-xyz/fee-flow) | [`4a419c94`](https://github.com/euler-xyz/fee-flow/tree/4a419c94e9cd68f65e11f07da9a69f726177cb9c) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ fixedCyclicalBinaryIRMFactory | [`0x6F1228b0...`](https://monadvision.com/address/0x6F1228b0A111173Dd3A295D32b5157fA3410de96) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ governorAccessControlEmergencyFactory | [`0x21BFce0c...`](https://monadvision.com/address/0x21BFce0c4E9411cd6c7F6D28edC9244f89bFEe63) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 48/48 |
| ✓ kinkIRMFactory | [`0x05Cccb5d...`](https://monadvision.com/address/0x05Cccb5d0f1e1D568804453B82453a719Dc53758) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ kinkyIRMFactory | [`0x3512f50B...`](https://monadvision.com/address/0x3512f50B3f0cA8725CcCBb6DDcc7307Ed2c17feb) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 6/6 |
| ✓ oracleRouterFactory | [`0xdDA3cBC1...`](https://monadvision.com/address/0xdDA3cBC18e90606A83FBae6F798991af06dFA902) | [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle) | [`deeffa7b`](https://github.com/euler-xyz/euler-price-oracle/tree/deeffa7b518618202802f37865ed654070a7175f) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 13/13 |
| ✓ protocolConfig | [`0x94A2d1d1...`](https://monadvision.com/address/0x94A2d1d175F1d828935a374091e2009CF1cED858) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ rEUL | [`0xff074349...`](https://monadvision.com/address/0xff074349C8b89bB7362bD25c58742896D817A862) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0) | 21/21 |
| ✓ sequenceRegistry | [`0x39F81037...`](https://monadvision.com/address/0x39F81037f20AC6068CbCd30f748094c58bfE7d7b) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [`9e3c760e`](https://github.com/euler-xyz/euler-vault-kit/tree/9e3c760e051f5d769f7c6edb9be30198a55117d4) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 2/2 |
| ✓ swapVerifier | [`0x65bF068c...`](https://monadvision.com/address/0x65bF068c88e0f006f76b871396B4DB1150dd9EAD) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | [`2b087370`](https://github.com/euler-xyz/evk-periphery/tree/2b087370) | 3/3 |


## Contracts Without Exact Match

These contracts could not be matched to any commit in the repository.
Showing diff between explorer source and current `master`:

### eulerSwapV1Factory

- **Address:** [`0x34f8f028c6a446a464c10a135f44fc6fb2cee1a9`](https://monadvision.com/address/0x34f8f028c6a446a464c10a135f44fc6fb2cee1a9)
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

- **Address:** [`0xbfd5c7bb1c208fec761284af7db6ff1f4314372c`](https://monadvision.com/address/0xbfd5c7bb1c208fec761284af7db6ff1f4314372c)
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

#### eulerEarnPublicAllocator

- **Deployed from:** [`dec63c2a`](https://github.com/euler-xyz/euler-earn/tree/dec63c2a)
- **Compare to master:** [`dec63c2a...master`](https://github.com/euler-xyz/euler-earn/compare/dec63c2a...master)
- **evk-periphery:** [`dec63c2a`](https://github.com/euler-xyz/evk-periphery/tree/dec63c2a)

_No diff available - see GitHub compare link above._

### euler-price-oracle

#### oracleRouterFactory

- **Deployed from:** [`deeffa7b`](https://github.com/euler-xyz/euler-price-oracle/tree/deeffa7b)
- **Compare to master:** [`deeffa7b...master`](https://github.com/euler-xyz/euler-price-oracle/compare/deeffa7b...master)
- **evk-periphery:** [`392c7bd0`](https://github.com/euler-xyz/evk-periphery/tree/392c7bd0)

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

