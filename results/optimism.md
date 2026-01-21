# Optimism Contract Verification Report

**Chain ID:** 10
**Explorer:** [https://optimistic.etherscan.io](https://optimistic.etherscan.io)

## Summary

- **Verified Contracts:** 40/49 ✓
- **Differences Found:** 9
- **Not Verified on Explorer:** 0
- **Errors:** 0

## Contracts

| Contract | Address | Explorer Name | Status | Files |
|----------|---------|---------------|--------|-------|
| accessControlEmergencyGovernor | [`0xf50F02aA...`](https://optimistic.etherscan.io/address/0xf50F02aA8993dE67D82f729b0662937C55006C61) | GovernorAccessControlEmergency | ✓ 100% | 34/34 |
| accessControlEmergencyGovernorAdminTimelockController | [`0xCb038F79...`](https://optimistic.etherscan.io/address/0xCb038F7935cD132733a8459553Df15385C266c56) | TimelockController | ✓ 100% | 12/12 |
| accessControlEmergencyGovernorWildcardTimelockController | [`0xb65d6aEA...`](https://optimistic.etherscan.io/address/0xb65d6aEA01C8039E5fBB32468196dA25AEA9fcc8) | TimelockController | ✓ 100% | 12/12 |
| eVaultFactoryGovernor | [`0xe4080721...`](https://optimistic.etherscan.io/address/0xe40807215dCcC32D8a264575E91B1fB9873dfC3e) | FactoryGovernor | ✓ 100% | 15/15 |
| eVaultFactoryTimelockController | [`0x4E589811...`](https://optimistic.etherscan.io/address/0x4E589811e72753B6bFFd9B7c507E1b14F04Aaae1) | TimelockController | ✓ 100% | 12/12 |
| adaptiveCurveIRMFactory | [`0x36790250...`](https://optimistic.etherscan.io/address/0x367902505cbba03F9c7ac71F8a00a8E252718f45) | EulerIRMAdaptiveCurveFactory | ✓ 100% | 6/6 |
| capRiskStewardFactory | [`0x50741d6f...`](https://optimistic.etherscan.io/address/0x50741d6feF8Db2d80b0bcBe71dAE6DbbE4641f40) | CapRiskStewardFactory | ✓ 100% | 36/36 |
| edgeFactory | [`0xEb0a720e...`](https://optimistic.etherscan.io/address/0xEb0a720eCbf1550108CF0189C15853e1ef4Bdb85) | EdgeFactory | ✓ 100% | 24/24 |
| edgeFactoryPerspective | [`0x0b5301f6...`](https://optimistic.etherscan.io/address/0x0b5301f610F4F04D510B28F5e7234363111c9907) | EdgeFactoryPerspective | ✓ 100% | 9/9 |
| escrowedCollateralPerspective | [`0xabEcAFaf...`](https://optimistic.etherscan.io/address/0xabEcAFaf0bC41A007a1A3eDAFAAdFA06a0a83eCB) | EscrowedCollateralPerspective | ✓ 100% | 11/11 |
| eulerEarnFactoryPerspective | [`0xa6eeE314...`](https://optimistic.etherscan.io/address/0xa6eeE314a5aEc21DBDe8C785AA5eE18182331aa4) | EulerEarnFactoryPerspective | ✓ 100% | 15/15 |
| eulerEarnGovernedPerspective | [`0x14829A32...`](https://optimistic.etherscan.io/address/0x14829A3259f4d2b509A2A7716F0218923BaC16d3) | GovernedPerspective | ✓ 100% | 13/13 |
| eulerUngoverned0xPerspective | [`0x6DF5324F...`](https://optimistic.etherscan.io/address/0x6DF5324FA7Ec14fAa294cb6961e4EE647A6b73EC) | EulerUngovernedPerspective | ✓ 100% | 26/26 |
| eulerUngovernedNzxPerspective | [`0x67907760...`](https://optimistic.etherscan.io/address/0x67907760F923897A337a9435e5027242B0E168A9) | EulerUngovernedPerspective | ✓ 100% | 26/26 |
| evkFactoryPerspective | [`0x044dc4d9...`](https://optimistic.etherscan.io/address/0x044dc4d90fe80f9239dd6493f11a09164Ca78854) | EVKFactoryPerspective | ✓ 100% | 8/8 |
| externalVaultRegistry | [`0x8cadE280...`](https://optimistic.etherscan.io/address/0x8cadE2806f83198676e89d3e77b97b472F656feb) | SnapshotRegistry | ✓ 100% | 6/6 |
| feeFlowController | [`0xD04C4B53...`](https://optimistic.etherscan.io/address/0xD04C4B53d086144DB07900792aDB6De5E5813F85) | FeeFlowController | ✓ 100% | 6/6 |
| fixedCyclicalBinaryIRMFactory | [`0xbdB2D336...`](https://optimistic.etherscan.io/address/0xbdB2D3364F9016F9C9F25f864e17D1F4196653DD) | EulerFixedCyclicalBinaryIRMFactory | ✓ 100% | 6/6 |
| governedPerspective | [`0x24E9B780...`](https://optimistic.etherscan.io/address/0x24E9B780e9CF56B326A08C81EEAe0242F2754304) | GovernedPerspective | ✓ 100% | 13/13 |
| governorAccessControlEmergencyFactory | [`0x19dD77f1...`](https://optimistic.etherscan.io/address/0x19dD77f17FaAe0415261E1585Fd1fB79c6CefE48) | GovernorAccessControlEmergencyFactory | ✓ 100% | 48/48 |
| irmRegistry | [`0xECB79454...`](https://optimistic.etherscan.io/address/0xECB7945403897a575Ee29296F39A6d2b45623b0F) | SnapshotRegistry | ✓ 100% | 6/6 |
| kinkIRMFactory | [`0xc01c5A25...`](https://optimistic.etherscan.io/address/0xc01c5A25659AF1f9415C15AE2e483C5b0c149041) | EulerKinkIRMFactory | ✓ 100% | 6/6 |
| kinkyIRMFactory | [`0xE82Df396...`](https://optimistic.etherscan.io/address/0xE82Df3960e0bd1d05b308D21fa8D51aCF664a21d) | EulerKinkyIRMFactory | ✓ 100% | 6/6 |
| oracleAdapterRegistry | [`0x0f62EBc5...`](https://optimistic.etherscan.io/address/0x0f62EBc542c9c0c4Dbf31f69A8E2d6f4aF93229B) | SnapshotRegistry | ✓ 100% | 6/6 |
| oracleRouterFactory | [`0xA0F284fe...`](https://optimistic.etherscan.io/address/0xA0F284fe1788c389E5F9897e106e600F1D20ee5c) | EulerRouterFactory | ✓ 100% | 13/13 |
| swapVerifier | [`0x804C754e...`](https://optimistic.etherscan.io/address/0x804C754ea602B54B28b0D3a10F8122e0a605dAD9) | SwapVerifier | ✓ 100% | 3/3 |
| swapper | [`0x76B103bE...`](https://optimistic.etherscan.io/address/0x76B103bECa4459C9E0dd35a8E5ad48c8f93e768f) | Swapper | ✓ 100% | 15/15 |
| termsOfUseSigner | [`0xAC2c4399...`](https://optimistic.etherscan.io/address/0xAC2c4399c27Ac78F5A1400E5062cf90858F75D6A) | TermsOfUseSigner | ✓ 100% | 4/4 |
| eulOFTAdapter | [`0xf932863E...`](https://optimistic.etherscan.io/address/0xf932863E538aF568dF9C79dA379fd8ffD8525342) | MintBurnOFTAdapter | ✗ Diff | 62/63 |
| DAO | [`0x02F65C73...`](https://optimistic.etherscan.io/address/0x02F65C73e5FD069A8CbA160188D175767588c7B4) | SafeProxy | ✗ Diff | 0/1 |
| labs | [`0x24BEc6FE...`](https://optimistic.etherscan.io/address/0x24BEc6FEFF64537d5970D3f568e21e8d5Ea31cB4) | SafeProxy | ✗ Diff | 0/1 |
| securityCouncil | [`0xff5E6347...`](https://optimistic.etherscan.io/address/0xff5E63472CAB7788f7E6041a71A0c03433E27664) | SafeProxy | ✗ Diff | 0/1 |
| securityPartnerA | [`0xBC20a9D5...`](https://optimistic.etherscan.io/address/0xBC20a9D5882dF0eB0B7D1f8dc3657B1a35b1c622) | SafeProxy | ✗ Diff | 0/1 |
| securityPartnerB | [`0xbDd1eA92...`](https://optimistic.etherscan.io/address/0xbDd1eA92E6396Cd88F3C77fADAF5Bc06a1304a63) | SafeProxy | ✗ Diff | 0/1 |
| EUL | [`0xA8A7c346...`](https://optimistic.etherscan.io/address/0xA8A7c3468Faa6750f1Dc5FDAfdcE03cDEA029304) | ERC20BurnableMintable | ✗ Diff | 27/28 |
| rEUL | [`0x5Ee4d837...`](https://optimistic.etherscan.io/address/0x5Ee4d837AB84285924AE746Eb5622Bb6774692be) | RewardToken | ✓ 100% | 21/21 |
| accountLens | [`0xA50b5255...`](https://optimistic.etherscan.io/address/0xA50b5255A83F1cC63f60Ecf512E3021266E26D76) | AccountLens | ✓ 100% | 13/13 |
| eulerEarnVaultLens | [`0x3920E0EF...`](https://optimistic.etherscan.io/address/0x3920E0EF4888d2D17392647BCc104da236E5F082) | EulerEarnVaultLens | ✓ 100% | 26/26 |
| irmLens | [`0xf4001bd1...`](https://optimistic.etherscan.io/address/0xf4001bd157b61e75080Ef298b81C19Bb3abfC222) | IRMLens | ✓ 100% | 13/13 |
| oracleLens | [`0x5409821a...`](https://optimistic.etherscan.io/address/0x5409821a457AA2F746CEc5ab5634696BdF9133f3) | OracleLens | ✗ Diff | 11/14 |
| utilsLens | [`0x47Eb1950...`](https://optimistic.etherscan.io/address/0x47Eb1950E1edB88AE84172B032d62e3E54045865) | UtilsLens | ✗ Diff | 14/18 |
| vaultLens | [`0x6De167fc...`](https://optimistic.etherscan.io/address/0x6De167fcfc1153a4584b758F53976c206062bdb2) | VaultLens | ✓ 100% | 45/45 |
| balanceTracker | [`0x9f1942a3...`](https://optimistic.etherscan.io/address/0x9f1942a30Dd99896945Ff544BE68c8ce790ECb57) | TrackingRewardStreams | ✓ 100% | 17/17 |
| eVaultFactory | [`0x7943231a...`](https://optimistic.etherscan.io/address/0x7943231a109703937bB7fb3D4dfB55D824deDe99) | GenericFactory | ✓ 100% | 3/3 |
| eVaultImplementation | [`0x94b14e46...`](https://optimistic.etherscan.io/address/0x94b14e4678B08c3Ee93cA8611672270575f9ead8) | EVault | ✓ 100% | 52/52 |
| eulerEarnFactory | [`0x83d4459F...`](https://optimistic.etherscan.io/address/0x83d4459F556d612837664117B94Befaf79b0Cc26) | EulerEarnFactory | ✓ 100% | 35/35 |
| evc | [`0xbfB28650...`](https://optimistic.etherscan.io/address/0xbfB28650Cd13CE879E7D56569Ed4715c299823E4) | EthereumVaultConnector | ✓ 100% | 9/9 |
| protocolConfig | [`0xAECe407a...`](https://optimistic.etherscan.io/address/0xAECe407aF2DBCd0B6C5Fb522744cCE6beac6Fb72) | ProtocolConfig | ✓ 100% | 2/2 |
| sequenceRegistry | [`0xb8551503...`](https://optimistic.etherscan.io/address/0xb8551503651FfB86371E750802d4094f7435758A) | SequenceRegistry | ✓ 100% | 2/2 |

## Differences Found

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

=== FILE NOT FOUND: contracts/proxies/SafeProxy.sol ===

```

### labs

```diff

=== FILE NOT FOUND: contracts/proxies/SafeProxy.sol ===

```

### securityCouncil

```diff

=== FILE NOT FOUND: contracts/proxies/SafeProxy.sol ===

```

### securityPartnerA

```diff

=== FILE NOT FOUND: contracts/proxies/SafeProxy.sol ===

```

### securityPartnerB

```diff

=== FILE NOT FOUND: contracts/proxies/SafeProxy.sol ===

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

### oracleLens

```diff

============================================================
FILE: src/Lens/OracleLens.sol
============================================================
--- Etherscan/src/Lens/OracleLens.sol
+++ Local/src/Lens/OracleLens.sol
@@ -34,6 +34,7 @@
     function cache() external view returns (uint208, uint48);
     function rate() external view returns (uint256);
     function rateProvider() external view returns (address);
+    function rwaOracle() external view returns (address);
     function resolveOracle(uint256 inAmount, address base, address quote)
         external
         view
@@ -77,22 +78,30 @@
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
@@ -161,6 +170,14 @@
                     base: IOracle(oracleAddress).base(),
                     quote: IOracle(oracleAddress).quote(),
                     rateProvider: IOracle(oracleAddress).rateProvider()
+                })
+            );
+        } else if (_strEq(name, "OndoOracle")) {
+            oracleInfo = abi.encode(
+                OndoOracleInfo({
+                    base: IOracle(oracleAddress).base(),
+                    quote: IOracle(oracleAddress).quote(),
+                    rwaOracle: IOracle(oracleAddress).rwaOracle()
                 })
             );
         } else if (_strEq(name, "PendleOracle")) {

============================================================
F...(truncated)
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
@@ -43,12 +43,32 @@
             // bitcoin-specific and test networks
             if (
                 block.chainid == 30 || block.chainid == 21000000 || block.chainid == 10143 || block.chainid == 80084
-          ...(truncated)
```

