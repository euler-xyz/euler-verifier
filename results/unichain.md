# Unichain Contract Verification Report

**Chain ID:** 130
**Explorer:** [https://unichain.blockscout.com](https://unichain.blockscout.com)
**Status:** ⚠️ 24/25 contracts verified

## Summary

| Contract | Address | Status | Source Repo | Commit |
|----------|---------|--------|-------------|--------|
| evc | [0x2A117696...](https://unichain.blockscout.com/address/0x2A1176964F5D7caE5406B627Bf6166664FE83c60) | ✅ | [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) | [a7d3c29e](https://github.com/euler-xyz/ethereum-vault-connector/tree/a7d3c29e) |
| eVaultFactory | [0xbAd8b5BD...](https://unichain.blockscout.com/address/0xbAd8b5BDFB2bcbcd78Cc9f1573D3Aad6E865e752) | ✅ | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [422bf244](https://github.com/euler-xyz/euler-vault-kit/tree/422bf244) |
| eVaultImplementation | [0x71d72507...](https://unichain.blockscout.com/address/0x71d7250732591C41D1BdeB1EA0Ee730E138E0c8b) | ✅ | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [422bf244](https://github.com/euler-xyz/euler-vault-kit/tree/422bf244) |
| protocolConfig | [0xdCD02E4e...](https://unichain.blockscout.com/address/0xdCD02E4eA8cd273498D315AD8c047305f8480656) | ✅ | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [422bf244](https://github.com/euler-xyz/euler-vault-kit/tree/422bf244) |
| sequenceRegistry | [0x08799a00...](https://unichain.blockscout.com/address/0x08799a00BC4a74890d65f77828cd2BFbBFcD96dB) | ✅ | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | [422bf244](https://github.com/euler-xyz/euler-vault-kit/tree/422bf244) |
| balanceTracker | [0xFbD12fbC...](https://unichain.blockscout.com/address/0xFbD12fbC91311A8f17598b935e35205EAF16Aa75) | ✅ | [reward-streams](https://github.com/euler-xyz/reward-streams) | [9eb7b8a7](https://github.com/euler-xyz/reward-streams/tree/9eb7b8a7) |
| eulerEarnFactory | [0xD785adD5...](https://unichain.blockscout.com/address/0xD785adD5F081F56616898E45b90dE307e3DC7d3E) | ❌ | euler-earn | - |
| eulerSwapV1Factory | [0x45b146BC...](https://unichain.blockscout.com/address/0x45b146BC07c9985589B52df651310e75C6BE066A) | ✅ | [euler-swap](https://github.com/euler-xyz/euler-swap) | [eulerswa](https://github.com/euler-xyz/euler-swap/tree/eulerswa) |
| eulerSwapV1Implementation | [0xd91B0bfA...](https://unichain.blockscout.com/address/0xd91B0bfACA4691E6Aca7E0E83D9B7F8917989a03) | ✅ | [euler-swap](https://github.com/euler-xyz/euler-swap) | [eulerswa](https://github.com/euler-xyz/euler-swap/tree/eulerswa) |
| eulerSwapV1Periphery | [0xdAAF468d...](https://unichain.blockscout.com/address/0xdAAF468d84DD8945521Ea40297ce6c5EEfc7003a) | ✅ | [euler-swap](https://github.com/euler-xyz/euler-swap) | [eulerswa](https://github.com/euler-xyz/euler-swap/tree/eulerswa) |
| eulerSwapV2Factory | [0xf211d70E...](https://unichain.blockscout.com/address/0xf211d70Ed785f0e981E9F3188804Af43734502F1) | ✅ | [euler-swap](https://github.com/euler-xyz/euler-swap) | [81cf6dc9](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) |
| eulerSwapV2Implementation | [0x144f1715...](https://unichain.blockscout.com/address/0x144f1715c673dA83917B09A5B4C23E2d72c8D411) | ✅ | [euler-swap](https://github.com/euler-xyz/euler-swap) | [81cf6dc9](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) |
| eulerSwapV2Periphery | [0xAD335516...](https://unichain.blockscout.com/address/0xAD335516c6E17815d9DD543fBCDFE325F8563E13) | ✅ | [euler-swap](https://github.com/euler-xyz/euler-swap) | [81cf6dc9](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) |
| eulerSwapV2ProtocolFeeConfig | [0xeA96Ed68...](https://unichain.blockscout.com/address/0xeA96Ed6896aB1F00e4Fc28C75D8e6655e56Cef85) | ✅ | [euler-swap](https://github.com/euler-xyz/euler-swap) | [81cf6dc9](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) |
| eulerSwapV2Registry | [0x9D9ce154...](https://unichain.blockscout.com/address/0x9D9ce1540b986eF77c02F8D40603193852D2E723) | ✅ | [euler-swap](https://github.com/euler-xyz/euler-swap) | [81cf6dc9](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) |
| adaptiveCurveIRMFactory | [0xbAbbE203...](https://unichain.blockscout.com/address/0xbAbbE203727f8327106e6087f075F2B2F2B738d1) | ✅ | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [master](https://github.com/euler-xyz/evk-periphery/tree/master) |
| fixedCyclicalBinaryIRMFactory | [0x6725657e...](https://unichain.blockscout.com/address/0x6725657eCF5f7Cc46D1E848376b4dB92D71D0d96) | ✅ | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [master](https://github.com/euler-xyz/evk-periphery/tree/master) |
| kinkIRMFactory | [0x34f3Ecd3...](https://unichain.blockscout.com/address/0x34f3Ecd35E05b0554B6F4ee5Ba3A373ADd6a2538) | ✅ | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [master](https://github.com/euler-xyz/evk-periphery/tree/master) |
| kinkyIRMFactory | [0x80594D09...](https://unichain.blockscout.com/address/0x80594D095B69C7E8AC4B9fc00da59e0504C3b9f5) | ✅ | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [master](https://github.com/euler-xyz/evk-periphery/tree/master) |
| eulerEarnPublicAllocator | [0x68a823a4...](https://unichain.blockscout.com/address/0x68a823a484a9D5A8daBB55c4d4d8006a45E557A9) | ✅ | [euler-earn](https://github.com/euler-xyz/euler-earn) | [773453b](https://github.com/euler-xyz/euler-earn/tree/773453b) |
| feeFlowController | [0x87BeecC6...](https://unichain.blockscout.com/address/0x87BeecC6B609723B2Ef071c20AA756846969240C) | ✅ | [fee-flow](https://github.com/euler-xyz/fee-flow) | [4a419c94](https://github.com/euler-xyz/fee-flow/tree/4a419c94) |
| governorAccessControlEmergencyFactory | [0x4F74dEd1...](https://unichain.blockscout.com/address/0x4F74dEd1980096C44B5fEE2A697B4B05AC75d987) | ✅ | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [master](https://github.com/euler-xyz/evk-periphery/tree/master) |
| oracleRouterFactory | [0xE551288F...](https://unichain.blockscout.com/address/0xE551288F0D82C10bBF517DBA66E15C60BF87FE8f) | ✅ | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [master](https://github.com/euler-xyz/evk-periphery/tree/master) |
| swapVerifier | [0x7eaf8C22...](https://unichain.blockscout.com/address/0x7eaf8C22480129E5D7426e3A33880D7bE19B50a7) | ✅ | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [master](https://github.com/euler-xyz/evk-periphery/tree/master) |
| termsOfUseSigner | [0xEfd9F447...](https://unichain.blockscout.com/address/0xEfd9F447b35aF280110975BCFA442050EF283D86) | ✅ | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | [master](https://github.com/euler-xyz/evk-periphery/tree/master) |

## Contracts With Differences

### eulerEarnFactory

```diff
--- local/src/EulerEarnFactory.sol
+++ explorer/src/EulerEarnFactory.sol
@@ -10,8 +10,8 @@
 
 import {EulerEarn} from "./EulerEarn.sol";
 
-import {Ownable, Context} from "openzeppelin-contracts/access/Ownable.sol";
-import {EVCUtil} from "ethereum-vault-connector/utils/EVCUtil.sol";
+import {Ownable, Context} from "access/Ownable.sol";
+import {EVCUtil} from "../utils/EVCUtil.sol";
 
 /// @title EulerEarnFactory
 /// @author Forked with gratitude from Morpho Labs. Inspired by Silo Labs.
--- local/@openzeppelin/contracts/interfaces/IERC20.sol
+++ explorer/@openzeppelin/contracts/interfaces/IERC20.sol
@@ -1,6 +1,79 @@
 // SPDX-License-Identifier: MIT
-// OpenZeppelin Contracts (last updated v5.0.0) (interfaces/IERC20.sol)
+// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)
 
 pragma solidity ^0.8.20;
 
-import {IERC20} from "../token/ERC20/IERC20.sol";
+/**
+ * @dev Interface of the ERC-20 standard as defined in the ERC.
+ */
+interface IERC20 {
+    /**
+     * @dev Emitted when `value` tokens are moved from one account (`from`) to
+     * another (`to`).
+     *
+     * Note that `value` may be zero.
+     */
+    event Transfer(address indexed from, address indexed to, uint256 value);
+
+    /**
+     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
+     * a call to {approve}. `value` is the new allowance.
+     */
+    event Approval(address indexed owner, address indexed spender, uint256 value);
+
+    /**
+     * @dev Returns the value of tokens in existence.
+     */
+    function totalSupply() external view returns (uint256);
+
+    /**
+     * @dev Returns the value of tokens owned by `account`.
+     */
+    function balanceOf(address account) external view returns (uint256);
+
+    /**
+     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
+     *
+     * Returns a boolean value indicating whether the operation succeeded.
+     *
+     * Emits a {Transfer} event.
+     */
+    function transfer(address to, uint256 value) external returns (bool);
+
+    /**
+     * @dev Returns the remaining number of tokens that `spender` will be
+     * allowed to spend on behalf of `owner` through {transferFrom}. This is
--- local/src/interfaces/IPublicAllocator.sol
+++ explorer/src/interfaces/IPublicAllocator.sol
@@ -3,7 +3,7 @@
 
 import {MarketAllocation} from "./IEulerEarn.sol";
 
-import {IERC4626} from "openzeppelin-contracts/interfaces/IERC4626.sol";
+import {IERC4626} from "../interfaces/IERC4626.sol";
 
 /// @dev Max settable flow cap, such that caps can always be stored on 128 bits.
 /// @dev The actual max possible flow cap is type(uint128).max-1.
--- local/src/libraries/EventsLib.sol
+++ explorer/src/libraries/EventsLib.sol
@@ -3,7 +3,7 @@
 
 import {FlowCapsConfig} from "../interfaces/IPublicAllocator.sol";
 
-import {IERC4626} from "openzeppelin-contracts/interfaces/IERC4626.sol";
+import {IERC4626} from "../interfaces/IERC4626.sol";
 
 import {PendingAddress} from "./PendingLib.sol";
 
--- local/src/libraries/SafeERC20Permit2Lib.sol
+++ explorer/src/libraries/SafeERC20Permit2Lib.sol
@@ -3,8 +3,8 @@
 pragma solidity ^0.8.0;
 
 import {IAllowanceTransfer} from "../interfaces/IAllowanceTransfer.sol";
-import {IERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";
-import {SafeERC20} from "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
+import {IERC20} from "../token/ERC20/ERC20.sol";
+import {SafeERC20} from "../token/ERC20/utils/SafeERC20.sol";
 
 /// @title SafeERC20Permit2Lib Library
 /// @custom:security-contact EMAIL
--- local/src/libraries/ErrorsLib.sol
+++ explorer/src/libraries/ErrorsLib.sol
... (84 more lines)
```
