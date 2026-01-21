# Avalanche Contract Verification Report

## Summary

| Status | Count |
|--------|-------|
| ✓ Verified (exact match) | 4 |
| ✗ No exact commit found | 0 |
| ~ Standalone with diff | 0 |
| - Error | 22 |
| **Total** | **26** |

## Verified Contracts

| Contract | Address | Source Repo | Source Commit | evk-periphery | Files |
|----------|---------|-------------|---------------|---------------|-------|
| ✓ eulerSwapV2Factory | [`0xd80e68B3...`](https://snowscan.xyz/address/0xd80e68B39e4408cb7D6c8E3343Bde46587013F62) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) | [`master`](https://github.com/euler-xyz/evk-periphery) | 57/57 |
| ✓ eulerSwapV2Periphery | [`0x4fef2f71...`](https://snowscan.xyz/address/0x4fef2f7146c0b4e6C0b1433badC6B7a2E1E7ECDb) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) | [`master`](https://github.com/euler-xyz/evk-periphery) | 11/11 |
| ✓ eulerSwapV2ProtocolFeeConfig | [`0x1C0e8b84...`](https://snowscan.xyz/address/0x1C0e8b841DA677C685D2a8376773e8A872C1ce5C) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) | [`master`](https://github.com/euler-xyz/evk-periphery) | 5/5 |
| ✓ eulerSwapV2Registry | [`0xF9f2dF8A...`](https://snowscan.xyz/address/0xF9f2dF8A5Cc71a0424dfA9EbdfdfF8A082C19184) | [euler-swap](https://github.com/euler-xyz/euler-swap) | [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9) | [`master`](https://github.com/euler-xyz/evk-periphery) | 35/35 |
| - adaptiveCurveIRMFactory | [`0x104BA4D7...`](https://snowscan.xyz/address/0x104BA4D746cf71F23341a7c855271A5E7dD19F58) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | - | - | 0/0 |
| - balanceTracker | [`0xAf565942...`](https://snowscan.xyz/address/0xAf5659428FEF1F6a701FaB46d8f3aF8371A9913D) | [reward-streams](https://github.com/euler-xyz/reward-streams) | - | - | 0/0 |
| - eVaultFactory | [`0xaf4B4c18...`](https://snowscan.xyz/address/0xaf4B4c18B17F6a2B32F6c398a3910bdCD7f26181) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | - | - | 0/0 |
| - eVaultImplementation | [`0x29E9b639...`](https://snowscan.xyz/address/0x29E9b639e165d919FEcf02521F8A9dA0492D4f21) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | - | - | 0/0 |
| - eulOFTAdapter | [`0xF1A5F97A...`](https://snowscan.xyz/address/0xF1A5F97AB84158Cf6d8ba8dEF68780Fc2Fd64310) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | - | - | 0/0 |
| - eulerEarnFactory | [`0x574B00f5...`](https://snowscan.xyz/address/0x574B00f5a0C56D370F19fa887a5545d74F52fAC2) | [euler-earn](https://github.com/euler-xyz/euler-earn) | - | - | 0/0 |
| - eulerEarnPublicAllocator | [`0x2524762d...`](https://snowscan.xyz/address/0x2524762ddb853AB1e572B81E5E6377a8a1536aA5) | [euler-earn](https://github.com/euler-xyz/euler-earn) | - | - | 0/0 |
| - eulerSwapV1Factory | [`0x8A1D3a48...`](https://snowscan.xyz/address/0x8A1D3a4850ed7deeC9003680Cf41b8E75D27e440) | [euler-swap](https://github.com/euler-xyz/euler-swap) | - | - | 0/0 |
| - eulerSwapV1Implementation | [`0x4F4FDeE3...`](https://snowscan.xyz/address/0x4F4FDeE3568aC31C46634fb2Df3FF44A156Be351) | [euler-swap](https://github.com/euler-xyz/euler-swap) | - | - | 0/0 |
| - eulerSwapV1Periphery | [`0x31F34124...`](https://snowscan.xyz/address/0x31F34124a37f94efd17201A1B88d5008cD444c72) | [euler-swap](https://github.com/euler-xyz/euler-swap) | - | - | 0/0 |
| - eulerSwapV2Implementation | [`0x2836825d...`](https://snowscan.xyz/address/0x2836825daeC3D5d8fD3ad71d61f72345bB868110) | [euler-swap](https://github.com/euler-xyz/euler-swap) | - | - | 0/0 |
| - evc | [`0xddcbe30A...`](https://snowscan.xyz/address/0xddcbe30A761Edd2e19bba930A977475265F36Fa1) | [ethereum-vault-connector](https://github.com/euler-xyz/ethereum-vault-connector) | - | - | 0/0 |
| - feeFlowController | [`0x95F21cD9...`](https://snowscan.xyz/address/0x95F21cD90057BBdC6fAc3f9b94D06b53C24B278c) | [fee-flow](https://github.com/euler-xyz/fee-flow) | - | - | 0/0 |
| - fixedCyclicalBinaryIRMFactory | [`0x53A37B5d...`](https://snowscan.xyz/address/0x53A37B5d8a30a49bCB463eF33d610d5E5040C64A) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | - | - | 0/0 |
| - governorAccessControlEmergencyFactory | [`0xcA14D397...`](https://snowscan.xyz/address/0xcA14D397219808F39724607e6401bD8C46CbF65f) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | - | - | 0/0 |
| - kinkIRMFactory | [`0xcad49893...`](https://snowscan.xyz/address/0xcad498936E09f38f18eD8375AeCD1d46689e7086) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | - | - | 0/0 |
| - kinkyIRMFactory | [`0x34E21196...`](https://snowscan.xyz/address/0x34E21196d7A303EE06c25aEF3B9CCD111c15c9aC) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | - | - | 0/0 |
| - oracleRouterFactory | [`0x80528F01...`](https://snowscan.xyz/address/0x80528F014E84658e85D3C6D4896A29Fa933Be696) | [euler-price-oracle](https://github.com/euler-xyz/euler-price-oracle) | - | - | 0/0 |
| - protocolConfig | [`0x8564160f...`](https://snowscan.xyz/address/0x8564160f30926eA1229DCcf24118c6De155D2e30) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | - | - | 0/0 |
| - rEUL | [`0x2e3b3273...`](https://snowscan.xyz/address/0x2e3b32730B4F6b6502BdAa9122df3B026eDE5391) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | - | - | 0/0 |
| - sequenceRegistry | [`0x9C38f923...`](https://snowscan.xyz/address/0x9C38f923baC407C818312EADEf69AdC116fd16FD) | [euler-vault-kit](https://github.com/euler-xyz/euler-vault-kit) | - | - | 0/0 |
| - swapVerifier | [`0x0d7938D9...`](https://snowscan.xyz/address/0x0d7938D9c31Cd7dD693752074284af133c1142de) | [evk-periphery](https://github.com/euler-xyz/evk-periphery) | - | - | 0/0 |


## Changes Since Deployment

This section shows what has changed in the source code between the deployment commit and current `master`.
These diffs help identify any changes made to the codebase after deployment.

### euler-swap

#### eulerSwapV2Factory

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`master`](https://github.com/euler-xyz/evk-periphery/tree/master)

_No diff available - see GitHub compare link above._

#### eulerSwapV2Periphery

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`master`](https://github.com/euler-xyz/evk-periphery/tree/master)

_No diff available - see GitHub compare link above._

#### eulerSwapV2ProtocolFeeConfig

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`master`](https://github.com/euler-xyz/evk-periphery/tree/master)

_No diff available - see GitHub compare link above._

#### eulerSwapV2Registry

- **Deployed from:** [`81cf6dc9`](https://github.com/euler-xyz/euler-swap/tree/81cf6dc9)
- **Compare to master:** [`81cf6dc9...master`](https://github.com/euler-xyz/euler-swap/compare/81cf6dc9...master)
- **evk-periphery:** [`master`](https://github.com/euler-xyz/evk-periphery/tree/master)

_No diff available - see GitHub compare link above._

