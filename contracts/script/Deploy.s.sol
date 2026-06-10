// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {ChoreVault} from "../src/ChoreVault.sol";

/**
 * @notice Deployment script for ChoreVault.
 *
 * Usage — Alfajores testnet:
 *   forge script script/Deploy.s.sol \
 *     --rpc-url alfajores \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Usage — Celo mainnet:
 *   forge script script/Deploy.s.sol \
 *     --rpc-url celo \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Required env vars:
 *   PRIVATE_KEY        — deployer private key (hex, with 0x prefix)
 *   AGENT_ADDRESS      — off-chain agent wallet address
 *   AAVE_POOL_ADDRESS  — Aave v3 Pool proxy on the target chain
 *
 * cUSD addresses (hardcoded per network):
 *   Mainnet:   0x765DE816845861e75A25fCA122bb6898B8B1282a
 *   Alfajores: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
 */
contract DeployChoreVault is Script {
    address constant CUSD_MAINNET   = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address constant CUSD_ALFAJORES = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    function run() external {
        uint256 deployerKey  = vm.envUint("PRIVATE_KEY");
        address agentAddress = vm.envAddress("AGENT_ADDRESS");
        address aavePool     = vm.envAddress("AAVE_POOL_ADDRESS");

        // Pick cUSD based on chain
        address cusd = block.chainid == 42220 ? CUSD_MAINNET : CUSD_ALFAJORES;

        vm.startBroadcast(deployerKey);

        ChoreVault vault = new ChoreVault(agentAddress, vm.addr(deployerKey), cusd, aavePool);

        vm.stopBroadcast();

        console2.log("=== ChoreVault Deployment ===");
        console2.log("ChoreVault :", address(vault));
        console2.log("Agent      :", agentAddress);
        console2.log("cUSD       :", cusd);
        console2.log("Aave Pool  :", aavePool);
        console2.log("Chain ID   :", block.chainid);
        console2.log("Deployer   :", vm.addr(deployerKey));
    }
}
