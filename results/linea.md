# Linea Contract Verification Report

**Chain ID:** 59144
**Explorer:** [https://lineascan.build](https://lineascan.build)

## Summary

- **Verified Contracts:** 29/55 ✓
- **Differences Found:** 25
- **Not Verified on Explorer:** 1
- **Errors:** 0

## Contracts

| Contract | Address | Explorer Name | Status | Files |
|----------|---------|---------------|--------|-------|
| accessControlEmergencyGovernor | [`0x703AB67C...`](https://lineascan.build/address/0x703AB67Cd644165503551Dfbf90727D3Bc47887D) | GovernorAccessControlEmergency | ✓ 100% | 34/34 |
| accessControlEmergencyGovernorAdminTimelockController | [`0x194B4dbe...`](https://lineascan.build/address/0x194B4dbe883B5afB1AbB3CA909b4F5f450c65305) | TimelockController | ✓ 100% | 12/12 |
| accessControlEmergencyGovernorWildcardTimelockController | [`0x413C28f6...`](https://lineascan.build/address/0x413C28f66fF7Fa72E1458D8A79A312e80eF6CB3D) | TimelockController | ✓ 100% | 12/12 |
| capRiskSteward | [`0x556f0E24...`](https://lineascan.build/address/0x556f0E249a6c035DBBc1BF83930feD5eA7d11486) | CapRiskSteward | ✓ 100% | 34/34 |
| eVaultFactoryGovernor | [`0x353A47A8...`](https://lineascan.build/address/0x353A47A85b7c943B2f450990Ed25c8E199D1f0e4) | FactoryGovernor | ✓ 100% | 15/15 |
| eVaultFactoryTimelockController | [`0x389DE0Fb...`](https://lineascan.build/address/0x389DE0Fb94d30dfC9dB83e9Ff8b0184738f47812) | TimelockController | ✓ 100% | 12/12 |
| eulerSwapV1Factory | [`0x970B065B...`](https://lineascan.build/address/0x970B065B572CC0118535Ad1101663CDBE7Db1e21) | EulerSwapFactory | ✗ Diff | 55/57 |
| eulerSwapV1Implementation | [`0x2b07caff...`](https://lineascan.build/address/0x2b07caff83C15c5a70C4C0867DFE7A0BE01025B0) | EulerSwap | ✗ Diff | 46/48 |
| eulerSwapV1Periphery | [`0x0de305aB...`](https://lineascan.build/address/0x0de305aB93902914909951A00079ea1df3FD98eA) | EulerSwapPeriphery | ✗ Diff | 9/11 |
| adaptiveCurveIRMFactory | [`0xc65a0e2a...`](https://lineascan.build/address/0xc65a0e2a410Ca52B0a5b57b1d239a857b3cd618b) | EulerIRMAdaptiveCurveFactory | ✓ 100% | 6/6 |
| capRiskStewardFactory | [`0xec1b7502...`](https://lineascan.build/address/0xec1b75024AFDe61492b514489DA6eEB02844c1Bb) | CapRiskStewardFactory | ✓ 100% | 36/36 |
| edgeFactory | [`0x2BeB74b6...`](https://lineascan.build/address/0x2BeB74b6845Ec05A78F642262CaA8e7e3f00C42a) | EdgeFactory | ✗ Diff | 23/24 |
| edgeFactoryPerspective | [`0xdcE47c28...`](https://lineascan.build/address/0xdcE47c28B8B34E0370b1DAe8067B8b2b9D24E3df) | EdgeFactoryPerspective | ✗ Diff | 8/9 |
| escrowedCollateralPerspective | [`0xc8d904FE...`](https://lineascan.build/address/0xc8d904FE94b65612AED5A73203C0eF8f3A0308C0) | EscrowedCollateralPerspective | ✗ Diff | 10/11 |
| eulerEarnFactoryPerspective | [`0xC19CeA18...`](https://lineascan.build/address/0xC19CeA1886Bc1876A85572bE4041082808936B26) | EulerEarnFactoryPerspective | ✗ Diff | 14/15 |
| eulerEarnGovernedPerspective | [`0xb42a9DD6...`](https://lineascan.build/address/0xb42a9DD67bD6b48940A862C0f0c8a6C5DD26582f) | GovernedPerspective | ✗ Diff | 12/13 |
| eulerEarnPublicAllocator | [`0x4148f90e...`](https://lineascan.build/address/0x4148f90e03facFF8D2d5EFb475E36F94b4Ab4994) | PublicAllocator | ✓ 100% | 14/14 |
| eulerUngoverned0xPerspective | [`0xA3B087CC...`](https://lineascan.build/address/0xA3B087CC842749e2dC251DE7Ea1967a936C5335a) | EulerUngovernedPerspective | ✗ Diff | 25/26 |
| eulerUngovernedNzxPerspective | [`0x246667c6...`](https://lineascan.build/address/0x246667c6f8119E64b5d88cC963Ef9d4391C77C81) | EulerUngovernedPerspective | ✗ Diff | 25/26 |
| evkFactoryPerspective | [`0x832ca1e2...`](https://lineascan.build/address/0x832ca1e2FCBedf717b9C71C00Dd26805e3bE4270) | EVKFactoryPerspective | ✗ Diff | 7/8 |
| externalVaultRegistry | [`0x28aF9ba9...`](https://lineascan.build/address/0x28aF9ba9152832A5B22f51510556801baDa96bBC) | SnapshotRegistry | ✓ 100% | 6/6 |
| feeFlowController | [`0xbF939812...`](https://lineascan.build/address/0xbF939812A673CB088f466d610c4b120b13eA5fAB) | FeeFlowController | ✓ 100% | 6/6 |
| feeFlowControllerUtil | [`0x79af541a...`](https://lineascan.build/address/0x79af541a66DDe9b177e76839344Ea9DC2ff746aB) | FeeFlowControllerUtil | ✓ 100% | 18/18 |
| fixedCyclicalBinaryIRMFactory | [`0x13697701...`](https://lineascan.build/address/0x13697701ff322367417469AB0497ea9C38b8A875) | EulerFixedCyclicalBinaryIRMFactory | ✓ 100% | 6/6 |
| governedPerspective | [`0x74f9fD22...`](https://lineascan.build/address/0x74f9fD22aA0Dd5Bbf6006a4c9818248eb476C50A) | GovernedPerspective | ✗ Diff | 12/13 |
| governorAccessControlEmergencyFactory | [`0x1Fa52975...`](https://lineascan.build/address/0x1Fa5297507c725f91479f3fa033a81c7f2E2d52D) | GovernorAccessControlEmergencyFactory | ✓ 100% | 48/48 |
| irmRegistry | [`0xe47732e6...`](https://lineascan.build/address/0xe47732e6BAB2ae02D35879C061ac1751e7BE7aF9) | SnapshotRegistry | ✓ 100% | 6/6 |
| kinkIRMFactory | [`0x2940Df42...`](https://lineascan.build/address/0x2940Df424dBDc697de86212eAb665721B6d32338) | EulerKinkIRMFactory | ✓ 100% | 6/6 |
| kinkyIRMFactory | [`0x054bF58e...`](https://lineascan.build/address/0x054bF58ec4531D6be9674558871f89C5867c6BfB) | EulerKinkyIRMFactory | ✓ 100% | 6/6 |
| oracleAdapterRegistry | [`0x5f81DdA3...`](https://lineascan.build/address/0x5f81DdA3f9155c31f552ABC3eb4B47676ba09680) | SnapshotRegistry | ✓ 100% | 6/6 |
| oracleRouterFactory | [`0xf0125F63...`](https://lineascan.build/address/0xf0125F638c7134e6997e4F825b78c324CcF289aF) | EulerRouterFactory | ✓ 100% | 13/13 |
| swapVerifier | [`0x77C9B0E7...`](https://lineascan.build/address/0x77C9B0E7Ac0405797F04E5230Ed0A54DB39f98f0) | SwapVerifier | ✓ 100% | 3/3 |
| swapper | [`0x1480Cfff...`](https://lineascan.build/address/0x1480Cfff566f27BbB2AEAd6eeABEc4BA068e5405) | Swapper | ✗ Diff | 14/15 |
| termsOfUseSigner | [`0x47613A45...`](https://lineascan.build/address/0x47613A45370f7C7021025Bad0DAe65be213678b9) | TermsOfUseSigner | ✓ 100% | 4/4 |
| eulOFTAdapter | [`0xd048d4e3...`](https://lineascan.build/address/0xd048d4e39e13482ECcE115E7BB71128d26ca19f1) | MintBurnOFTAdapter | ✗ Diff | 62/63 |
| DAO | [`0x89Ad331C...`](https://lineascan.build/address/0x89Ad331C4B69d7b251C9937DD9A9CEA6E357997a) | SafeProxy | ✗ Diff | 0/1 |
| labs | [`0xC9C469aE...`](https://lineascan.build/address/0xC9C469aE8d8e8d29368100aE91275deE9Dbc0865) | SafeProxy | ✗ Diff | 0/1 |
| securityCouncil | [`0x1070c6db...`](https://lineascan.build/address/0x1070c6dbB619853D52093dF5ceEa49E029adb61A) | SafeProxy | ✗ Diff | 0/1 |
| securityPartnerA | [`0x519F6d7F...`](https://lineascan.build/address/0x519F6d7F9feE220188CE6D27225CbBA0F2082a58) | SafeProxy | ✗ Diff | 0/1 |
| securityPartnerB | [`0xBe90E020...`](https://lineascan.build/address/0xBe90E0208b1BD19007b39B33cc40e8e6d26D3990) | SafeProxy | ✗ Diff | 0/1 |
| EUL | [`0x3eBd0148...`](https://lineascan.build/address/0x3eBd0148BADAb9388936E4472C4415D5700478A5) | ERC20BurnableMintable | ✗ Diff | 27/28 |
| rEUL | [`0xe15C5F31...`](https://lineascan.build/address/0xe15C5F31cd7B767883F5654CDD3aFac28966B0a9) | RewardToken | ✓ 100% | 21/21 |
| accountLens | [`0xdeB31DCf...`](https://lineascan.build/address/0xdeB31DCfDe72abf31b571AfB022840dCB5D73FCf) | AccountLens | ✓ 100% | 13/13 |
| eulerEarnVaultLens | [`0x06019976...`](https://lineascan.build/address/0x06019976448Fadc735616f42ED6D02a098561A07) | EulerEarnVaultLens | ✗ Diff | 22/26 |
| irmLens | [`0x294F6f07...`](https://lineascan.build/address/0x294F6f07752Afb3470c5c2B86271C43BB3Df6284) | IRMLens | ✗ Diff | 11/13 |
| oracleLens | [`0xFf1177B9...`](https://lineascan.build/address/0xFf1177B9e483b21820052dF2B39DebB9584855d1) | N/A | - N/A | 0/0 |
| utilsLens | [`0x64aD120b...`](https://lineascan.build/address/0x64aD120b92d5562d72Af42eE39B82c56fD23d206) | UtilsLens | ✗ Diff | 14/18 |
| vaultLens | [`0xd20E9D6c...`](https://lineascan.build/address/0xd20E9D6cfa0431aC306cC9906896a7BC0BE0Db64) | VaultLens | ✗ Diff | 40/45 |
| balanceTracker | [`0xB9E491A3...`](https://lineascan.build/address/0xB9E491A3BB9d4B155d31a9cA6B9dE245CA16AAe6) | TrackingRewardStreams | ✓ 100% | 17/17 |
| eVaultFactory | [`0x84711986...`](https://lineascan.build/address/0x84711986Fd3BF0bFe4a8e6d7f4E22E67f7f27F04) | GenericFactory | ✓ 100% | 3/3 |
| eVaultImplementation | [`0x58270C41...`](https://lineascan.build/address/0x58270C41552Bb2bef3Dc4e103b6f0c226032f007) | EVault | ✓ 100% | 52/52 |
| eulerEarnFactory | [`0x377879A0...`](https://lineascan.build/address/0x377879A039343FEc7564e54616e519328951DA6D) | EulerEarnFactory | ✗ Diff | 33/35 |
| evc | [`0xd8CeCEe9...`](https://lineascan.build/address/0xd8CeCEe9A04eA3d941a959F68fb4486f23271d09) | EthereumVaultConnector | ✓ 100% | 9/9 |
| protocolConfig | [`0x91868601...`](https://lineascan.build/address/0x91868601df03ED8E134EaAaB5E06F7183CC8383f) | ProtocolConfig | ✓ 100% | 2/2 |
| sequenceRegistry | [`0xcB1bB0A8...`](https://lineascan.build/address/0xcB1bB0A8A7ddeb09983dC1e7F880DCEdc39362BA) | SequenceRegistry | ✓ 100% | 2/2 |

## Differences Found

### eulerSwapV1Factory

```diff

============================================================
FILE: lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
============================================================
--- Etherscan/lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
+++ Local/lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
@@ -5,7 +5,6 @@
 
 import {IERC20} from "../IERC20.sol";
 import {IERC1363} from "../../../interfaces/IERC1363.sol";
-import {Address} from "../../../utils/Address.sol";
 
 /**
  * @title SafeERC20

============================================================
FILE: lib/openzeppelin-contracts/contracts/utils/Address.sol
============================================================
--- Etherscan/lib/openzeppelin-contracts/contracts/utils/Address.sol
+++ Local/lib/openzeppelin-contracts/contracts/utils/Address.sol
@@ -35,9 +35,9 @@
             revert Errors.InsufficientBalance(address(this).balance, amount);
         }
 
-        (bool success, ) = recipient.call{value: amount}("");
+        (bool success, bytes memory returndata) = recipient.call{value: amount}("");
         if (!success) {
-            revert Errors.FailedCall();
+            _revert(returndata);
         }
     }
 

```

### eulerSwapV1Implementation

```diff

============================================================
FILE: lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
============================================================
--- Etherscan/lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
+++ Local/lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
@@ -5,7 +5,6 @@
 
 import {IERC20} from "../IERC20.sol";
 import {IERC1363} from "../../../interfaces/IERC1363.sol";
-import {Address} from "../../../utils/Address.sol";
 
 /**
  * @title SafeERC20

============================================================
FILE: lib/openzeppelin-contracts/contracts/utils/Address.sol
============================================================
--- Etherscan/lib/openzeppelin-contracts/contracts/utils/Address.sol
+++ Local/lib/openzeppelin-contracts/contracts/utils/Address.sol
@@ -35,9 +35,9 @@
             revert Errors.InsufficientBalance(address(this).balance, amount);
         }
 
-        (bool success, ) = recipient.call{value: amount}("");
+        (bool success, bytes memory returndata) = recipient.call{value: amount}("");
         if (!success) {
-            revert Errors.FailedCall();
+            _revert(returndata);
         }
     }
 

```

### eulerSwapV1Periphery

```diff

============================================================
FILE: lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
============================================================
--- Etherscan/lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
+++ Local/lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol
@@ -5,7 +5,6 @@
 
 import {IERC20} from "../IERC20.sol";
 import {IERC1363} from "../../../interfaces/IERC1363.sol";
-import {Address} from "../../../utils/Address.sol";
 
 /**
  * @title SafeERC20

============================================================
FILE: lib/openzeppelin-contracts/contracts/utils/Address.sol
============================================================
--- Etherscan/lib/openzeppelin-contracts/contracts/utils/Address.sol
+++ Local/lib/openzeppelin-contracts/contracts/utils/Address.sol
@@ -35,9 +35,9 @@
             revert Errors.InsufficientBalance(address(this).balance, amount);
         }
 
-        (bool success, ) = recipient.call{value: amount}("");
+        (bool success, bytes memory returndata) = recipient.call{value: amount}("");
         if (!success) {
-            revert Errors.FailedCall();
+            _revert(returndata);
         }
     }
 

```

### edgeFactory

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### edgeFactoryPerspective

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### escrowedCollateralPerspective

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### eulerEarnFactoryPerspective

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### eulerEarnGovernedPerspective

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### eulerUngoverned0xPerspective

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### eulerUngovernedNzxPerspective

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### evkFactoryPerspective

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### governedPerspective

```diff

============================================================
FILE: src/Perspectives/implementation/BasePerspective.sol
============================================================
--- Etherscan/src/Perspectives/implementation/BasePerspective.sol
+++ Local/src/Perspectives/implementation/BasePerspective.sol
@@ -45,7 +45,7 @@
             transientVerifiedHash := keccak256(0, 64)
 
             // if optimistically verified, return
-            if eq(sload(transientVerifiedHash), true) { return(0, 0) }
+            if eq(tload(transientVerifiedHash), true) { return(0, 0) }
         }
 
         // if already verified, return
@@ -54,13 +54,13 @@
         address _vault;
         bool _failEarly;
         assembly {
-            _vault := sload(transientVault.slot)
-            _failEarly := sload(transientFailEarly.slot)
-            sstore(transientVault.slot, vault)
-            sstore(transientFailEarly.slot, failEarly)
+            _vault := tload(transientVault.slot)
+            _failEarly := tload(transientFailEarly.slot)
+            tstore(transientVault.slot, vault)
+            tstore(transientFailEarly.slot, failEarly)
 
             // optimistically assume that the vault is verified
-            sstore(transientVerifiedHash, true)
+            tstore(transientVerifiedHash, true)
         }
 
         // perform the perspective verification
@@ -69,14 +69,10 @@
         uint256 errors;
         assembly {
             // restore the cached values
-            sstore(transientVault.slot, _vault)
-            sstore(transientFailEarly.slot, _failEarly)
+            tstore(transientVault.slot, _vault)
+            tstore(transientFailEarly.slot, _failEarly)
 
-            errors := sload(transientErrors.slot)
-
-            // clear the transient storage
-            sstore(transientErrors.slot, 0)
-            sstore(transientVerifiedHash, false)
+            errors := tload(transientErrors.slot)
         }
 
         // if early fail was not requested, we need to check for any property errors that may have occurred.
@@ -118,19 +114,19 @@
 
         bool failEarly;
         assembly {
-            failEarly := sload(transientFailEarly.slot)
+            failEarly := tload(transientFailEarly.slot)
         }
 
         if (failEarly) {
             address vault;
             assembly {
-                vault := sload(transientVault.slot)
+                vault := tload(transientVault.slot)
             }
             revert PerspectiveError(address(this), vault, errorCode);
         } else {
             assembly {
-                let errors := sload(transientErrors.slot)
-                sstore(transientErrors.slot, or(errors, errorCode))
+                let errors := tload(transientErrors.slot)
+                tstore(transientErrors.slot, or(errors, errorCode))
             }
         }
     }

```

### swapper

```diff

============================================================
FILE: src/Swaps/Swapper.sol
============================================================
--- Etherscan/src/Swaps/Swapper.sol
+++ Local/src/Swaps/Swapper.sol
@@ -50,7 +50,7 @@
     {}
 
     /// @inheritdoc ISwapper
-    function swap(SwapParams memory params) public externalLock {
+    function swap(SwapParams memory params) public virtual externalLock {
         if (params.mode >= MODE_MAX_VALUE) revert Swapper_UnknownMode();
 
         if (params.handler == HANDLER_GENERIC) {
@@ -77,7 +77,7 @@
 
     /// @inheritdoc ISwapper
     /// @dev in case of over-swapping to repay, pass max uint amount
-    function repay(address token, address vault, uint256 repayAmount, address account) public externalLock {
+    function repay(address token, address vault, uint256 repayAmount, address account) public virtual externalLock {
         setMaxAllowance(token, vault);
         uint256 balance = IERC20(token).balanceOf(address(this));
         repayAmount = _capRepayToBalance(repayAmount, balance);
@@ -86,17 +86,21 @@
     }
 
     /// @inheritdoc ISwapper
-    function repayAndDeposit(address token, address vault, uint256 repayAmount, address account) public externalLock {
+    function repayAndDeposit(address token, address vault, uint256 repayAmount, address account)
+        public
+        virtual
+        externalLock
+    {
         _repayAndDeposit(token, vault, repayAmount, account);
     }
 
     /// @inheritdoc ISwapper
-    function deposit(address token, address vault, uint256 amountMin, address account) public externalLock {
+    function deposit(address token, address vault, uint256 amountMin, address account) public virtual externalLock {
         _deposit(token, vault, amountMin, account);
     }
 
     /// @inheritdoc ISwapper
-    function sweep(address token, uint256 amountMin, address to) public externalLock {
+    function sweep(address token, uint256 amountMin, address to) public virtual externalLock {
         uint256 balance = IERC20(token).balanceOf(address(this));
         if (balance >= amountMin) {
             SafeERC20Lib.safeTransfer(IERC20(token), to, balance);
@@ -104,7 +108,7 @@
     }
 
     /// @inheritdoc ISwapper
-    function multicall(bytes[] memory calls) external externalLock {
+    function multicall(bytes[] memory calls) public virtual externalLock {
         for (uint256 i; i < calls.length; i++) {
             (bool success, bytes memory result) = address(this).call(calls[i]);
             if (!success) RevertBytes.revertBytes(result);

```

### eulOFTAdapter

```diff

============================================================
FILE: src/ERC20/deployed/ERC20BurnableMintable.sol
============================================================
--- Etherscan/src/ERC20/deployed/ERC20BurnableMintable.sol
+++ Local/src/ERC20/deployed/ERC20BurnableMintable.sol
@@ -45,7 +45,7 @@
     /// @notice Mints new tokens and assigns them to an account
     /// @param _account The address that will receive the minted tokens
     /// @param _amount The amount of tokens to mint
-    function mint(address _account, uint256 _amount) external onlyRole(MINTER_ROLE) {
+    function mint(address _account, uint256 _amount) external virtual onlyRole(MINTER_ROLE) {
         _mint(_account, _amount);
     }
 

```

### DAO

```diff

=== FILE NOT FOUND: SafeProxy ===

```

### labs

```diff

=== FILE NOT FOUND: SafeProxy ===

```

### securityCouncil

```diff

=== FILE NOT FOUND: SafeProxy ===

```

### securityPartnerA

```diff

=== FILE NOT FOUND: SafeProxy ===

```

### securityPartnerB

```diff

=== FILE NOT FOUND: SafeProxy ===

```

### EUL

```diff

============================================================
FILE: src/ERC20/deployed/ERC20BurnableMintable.sol
============================================================
--- Etherscan/src/ERC20/deployed/ERC20BurnableMintable.sol
+++ Local/src/ERC20/deployed/ERC20BurnableMintable.sol
@@ -45,7 +45,7 @@
     /// @notice Mints new tokens and assigns them to an account
     /// @param _account The address that will receive the minted tokens
     /// @param _amount The amount of tokens to mint
-    function mint(address _account, uint256 _amount) external onlyRole(MINTER_ROLE) {
+    function mint(address _account, uint256 _amount) external virtual onlyRole(MINTER_ROLE) {
         _mint(_account, _amount);
     }
 

```

### eulerEarnVaultLens

```diff

============================================================
FILE: src/Lens/UtilsLens.sol
============================================================
--- Etherscan/src/Lens/UtilsLens.sol
+++ Local/src/Lens/UtilsLens.sol
@@ -126,7 +126,7 @@
 
         if (adapters.length == 0) {
             (bool success, bytes memory data) =
-                asset.staticcall(abi.encodeCall(IEVault(asset).convertToAssets, (amountIn)));
+                asset.staticcall{gas: 100000}(abi.encodeCall(IEVault(asset).convertToAssets, (amountIn)));
 
             if (success && data.length >= 32) {
                 amountIn = abi.decode(data, (uint256));

============================================================
FILE: src/Lens/Utils.sol
============================================================
--- Etherscan/src/Lens/Utils.sol
+++ Local/src/Lens/Utils.sol
@@ -37,15 +37,13 @@
             return 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
         } else if (block.chainid == 43114) {
             return 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;
-        } else if (block.chainid == 59144) {
-            return 0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f;
         } else if (block.chainid == 80094) {
             return 0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590;
         } else {
             // bitcoin-specific and test networks
             if (
                 block.chainid == 30 || block.chainid == 21000000 || block.chainid == 10143 || block.chainid == 80084
-                    || block.chainid == 2390
+                    || block.chainid == 2390 || block.chainid == 998
             ) {
                 return address(0);
             }
@@ -56,6 +54,21 @@
 
             // TAC
             if (block.chainid == 239) {
+                return address(0);
+            }
+
+            // Plasma
+            if (block.chainid == 9745) {
+                return address(0);
+            }
+
+            // Monad
+            if (block.chainid == 143) {
+                return address(0);
+            }
+
+            // Sepolia
+            if (block.chainid == 11155111) {
                 return address(0);
             }
         }

============================================================
FILE: src/Lens/LensTypes.sol
============================================================
--- Etherscan/src/Lens/LensTypes.sol
+++ Local/src/Lens/LensTypes.sol
@@ -49,19 +49,19 @@
 struct AccountLiquidityInfo {
     bool queryFailure;
     bytes queryFailureReason;
+    address account;
+    address vault;
+    address unitOfAccount;
     int256 timeToLiquidation;
-    uint256 liabilityValue;
+    uint256 liabilityValueBorrowing;
+    uint256 liabilityValueLiquidation;
     uint256 collateralValueBorrowing;
     uint256 collateralValueLiquidation;
     uint256 collateralValueRaw;
-    CollateralLiquidityInfo[] collateralLiquidityBorrowingInfo;
-    CollateralLiquidityInfo[] collateralLiquidityLiquidationInfo;
-    CollateralLiquidityInfo[] collateralLiquidityRawInfo;
-}
-
...(truncated)
```

### irmLens

```diff

============================================================
FILE: src/Lens/Utils.sol
============================================================
--- Etherscan/src/Lens/Utils.sol
+++ Local/src/Lens/Utils.sol
@@ -37,15 +37,13 @@
             return 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
         } else if (block.chainid == 43114) {
             return 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;
-        } else if (block.chainid == 59144) {
-            return 0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f;
         } else if (block.chainid == 80094) {
             return 0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590;
         } else {
             // bitcoin-specific and test networks
             if (
                 block.chainid == 30 || block.chainid == 21000000 || block.chainid == 10143 || block.chainid == 80084
-                    || block.chainid == 2390
+                    || block.chainid == 2390 || block.chainid == 998
             ) {
                 return address(0);
             }
@@ -56,6 +54,21 @@
 
             // TAC
             if (block.chainid == 239) {
+                return address(0);
+            }
+
+            // Plasma
+            if (block.chainid == 9745) {
+                return address(0);
+            }
+
+            // Monad
+            if (block.chainid == 143) {
+                return address(0);
+            }
+
+            // Sepolia
+            if (block.chainid == 11155111) {
                 return address(0);
             }
         }

============================================================
FILE: src/Lens/LensTypes.sol
============================================================
--- Etherscan/src/Lens/LensTypes.sol
+++ Local/src/Lens/LensTypes.sol
@@ -49,19 +49,19 @@
 struct AccountLiquidityInfo {
     bool queryFailure;
     bytes queryFailureReason;
+    address account;
+    address vault;
+    address unitOfAccount;
     int256 timeToLiquidation;
-    uint256 liabilityValue;
+    uint256 liabilityValueBorrowing;
+    uint256 liabilityValueLiquidation;
     uint256 collateralValueBorrowing;
     uint256 collateralValueLiquidation;
     uint256 collateralValueRaw;
-    CollateralLiquidityInfo[] collateralLiquidityBorrowingInfo;
-    CollateralLiquidityInfo[] collateralLiquidityLiquidationInfo;
-    CollateralLiquidityInfo[] collateralLiquidityRawInfo;
-}
-
-struct CollateralLiquidityInfo {
-    address collateral;
-    uint256 collateralValue;
+    address[] collaterals;
+    uint256[] collateralValuesBorrowing;
+    uint256[] collateralValuesLiquidation;
+    uint256[] collateralValuesRaw;
 }
 
 struct VaultInfoERC4626 {
@@ -77,6 +77,60 @@
     uint256 totalShares;
     uint256 totalAssets;
     bool isEVault;
+}
+
+struct VaultInfoStatic {
+    uint256 timestamp;
+    address vault;
+    string vaultName;
+    string vaultSymbol;
+    uint256 vaultDecimals;
+    address asset;
+    string assetName;
+    string assetSymbol;
+    uint256 assetDecimals;
+    address unitOfAccount;
+   ...(truncated)
```

### utilsLens

```diff

============================================================
FILE: src/Lens/UtilsLens.sol
============================================================
--- Etherscan/src/Lens/UtilsLens.sol
+++ Local/src/Lens/UtilsLens.sol
@@ -126,7 +126,7 @@
 
         if (adapters.length == 0) {
             (bool success, bytes memory data) =
-                asset.staticcall(abi.encodeCall(IEVault(asset).convertToAssets, (amountIn)));
+                asset.staticcall{gas: 100000}(abi.encodeCall(IEVault(asset).convertToAssets, (amountIn)));
 
             if (success && data.length >= 32) {
                 amountIn = abi.decode(data, (uint256));

============================================================
FILE: src/Lens/OracleLens.sol
============================================================
--- Etherscan/src/Lens/OracleLens.sol
+++ Local/src/Lens/OracleLens.sol
@@ -78,22 +78,30 @@
         }
 
         if (_strEq(name, "ChainlinkOracle")) {
+            (bool success, bytes memory result) =
+                IOracle(oracleAddress).feed().staticcall(abi.encodeCall(IOracle.description, ()));
+            string memory feedDescription = success && result.length >= 32 ? abi.decode(result, (string)) : "";
+
             oracleInfo = abi.encode(
                 ChainlinkOracleInfo({
                     base: IOracle(oracleAddress).base(),
                     quote: IOracle(oracleAddress).quote(),
                     feed: IOracle(oracleAddress).feed(),
-                    feedDescription: IOracle(IOracle(oracleAddress).feed()).description(),
+                    feedDescription: feedDescription,
                     maxStaleness: IOracle(oracleAddress).maxStaleness()
                 })
             );
         } else if (_strEq(name, "ChainlinkInfrequentOracle")) {
+            (bool success, bytes memory result) =
+                IOracle(oracleAddress).feed().staticcall(abi.encodeCall(IOracle.description, ()));
+            string memory feedDescription = success && result.length >= 32 ? abi.decode(result, (string)) : "";
+
             oracleInfo = abi.encode(
                 ChainlinkInfrequentOracleInfo({
                     base: IOracle(oracleAddress).base(),
                     quote: IOracle(oracleAddress).quote(),
                     feed: IOracle(oracleAddress).feed(),
-                    feedDescription: IOracle(IOracle(oracleAddress).feed()).description(),
+                    feedDescription: feedDescription,
                     maxStaleness: IOracle(oracleAddress).maxStaleness()
                 })
             );

============================================================
FILE: src/Lens/Utils.sol
============================================================
--- Etherscan/src/Lens/Utils.sol
+++ Local/src/Lens/Utils.sol
@@ -37,20 +37,38 @@
             return 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
         } else if (block.chainid == 43114) {
             return 0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB;
-        } else if (bloc...(truncated)
```

### vaultLens

```diff

============================================================
FILE: src/Lens/VaultLens.sol
============================================================
--- Etherscan/src/Lens/VaultLens.sol
+++ Local/src/Lens/VaultLens.sol
@@ -29,12 +29,12 @@
         backupUnitOfAccounts.push(0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB);
     }
 
-    function getVaultInfoFull(address vault) public view returns (VaultInfoFull memory) {
-        VaultInfoFull memory result;
+    function getVaultInfoStatic(address vault) public view returns (VaultInfoStatic memory) {
+        VaultInfoStatic memory result;
 
         result.timestamp = block.timestamp;
-
         result.vault = vault;
+
         result.vaultName = IEVault(vault).name();
         result.vaultSymbol = IEVault(vault).symbol();
         result.vaultDecimals = IEVault(vault).decimals();
@@ -49,6 +49,27 @@
         result.unitOfAccountSymbol = _getStringOrBytes32(result.unitOfAccount, IEVault(vault).symbol.selector);
         result.unitOfAccountDecimals = _getDecimals(result.unitOfAccount);
 
+        result.dToken = IEVault(vault).dToken();
+        result.oracle = IEVault(vault).oracle();
+        result.evc = IEVault(vault).EVC();
+        result.protocolConfig = IEVault(vault).protocolConfigAddress();
+        result.balanceTracker = IEVault(vault).balanceTrackerAddress();
+        result.permit2 = IEVault(vault).permit2Address();
+        result.creator = IEVault(vault).creator();
+
+        return result;
+    }
+
+    function getVaultInfoDynamic(address vault) public view returns (VaultInfoDynamic memory) {
+        VaultInfoDynamic memory result;
+
+        address asset = IEVault(vault).asset();
+        address unitOfAccount = IEVault(vault).unitOfAccount();
+        address oracle = IEVault(vault).oracle();
+
+        result.timestamp = block.timestamp;
+        result.vault = vault;
+
         result.totalShares = IEVault(vault).totalSupply();
         result.totalCash = IEVault(vault).cash();
         result.totalBorrowed = IEVault(vault).totalBorrows();
@@ -72,16 +93,7 @@
         result.supplyCap = AmountCapLib.resolve(AmountCap.wrap(uint16(result.supplyCap)));
         result.borrowCap = AmountCapLib.resolve(AmountCap.wrap(uint16(result.borrowCap)));
 
-        result.dToken = IEVault(vault).dToken();
-        result.oracle = IEVault(vault).oracle();
         result.interestRateModel = IEVault(vault).interestRateModel();
-
-        result.evc = IEVault(vault).EVC();
-        result.protocolConfig = IEVault(vault).protocolConfigAddress();
-        result.balanceTracker = IEVault(vault).balanceTrackerAddress();
-        result.permit2 = IEVault(vault).permit2Address();
-
-        result.creator = IEVault(vault).creator();
         result.governorAdmin = IEVault(vault).governorAdmin();
 
         if (result.interestRateModel == address(0)) {
@@ -101,33 +113,33 @@
 
         result.collateralLTVInfo = getRecognizedCollateralsLTVInfo(vault);
 
-        result.liabilityPriceInfo = utilsLens.g...(truncated)
```

### eulerEarnFactory

```diff

============================================================
FILE: src/interfaces/IEulerEarn.sol
============================================================
--- Etherscan/src/interfaces/IEulerEarn.sol
+++ Local/src/interfaces/IEulerEarn.sol
@@ -120,10 +120,10 @@
     function revokePendingMarketRemoval(IERC4626 id) external;
 
     /// @notice Sets the name of the Earn vault.
-    //function setName(string memory newName) external;
+    function setName(string memory newName) external;
 
     /// @notice Sets the symbol of the Earn vault.
-    //function setSymbol(string memory newSymbol) external;
+    function setSymbol(string memory newSymbol) external;
 
     /// @notice Submits a `newGuardian`.
     /// @notice Warning: a malicious guardian could disrupt the Earn vault's operation, and would have the power to revoke

============================================================
FILE: src/EulerEarn.sol
============================================================
--- Etherscan/src/EulerEarn.sol
+++ Local/src/EulerEarn.sol
@@ -190,8 +190,7 @@
     }
 
     /* ONLY OWNER FUNCTIONS */
-// commented out not to exceed 24kB limit
-/*
+
     /// @inheritdoc IEulerEarnBase
     function setName(string memory newName) external onlyOwner {
         _name = newName;
@@ -205,7 +204,7 @@
 
         emit EventsLib.SetSymbol(newSymbol);
     }
-*/
+
     /// @inheritdoc IEulerEarnBase
     function setCurator(address newCurator) external onlyOwner {
         if (newCurator == curator) revert ErrorsLib.AlreadySet();

```


## Not Verified on Explorer

- oracleLens: `0xFf1177B9e483b21820052dF2B39DebB9584855d1`
