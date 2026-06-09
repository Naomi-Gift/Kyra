// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ChoreAgent.sol";

/**
 * Usage:
 *
 *   # Celo Alfajores (testnet)
 *   forge script script/Deploy.s.sol \
 *     --rpc-url celo_alfajores \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 *   # Celo Mainnet
 *   forge script script/Deploy.s.sol \
 *     --rpc-url celo \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Required env vars:
 *   PRIVATE_KEY        — deployer private key
 *   AGENT_ADDRESS      — address of the off-chain agent wallet
 *   CELO_RPC_URL       — for mainnet
 *   CELOSCAN_API_KEY   — for contract verification
 */
contract Deploy is Script {
    // Celo cUSD token address (mainnet)
    address constant CUSD_MAINNET    = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    // Celo cUSD token address (Alfajores testnet)
    address constant CUSD_ALFAJORES  = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    function run() external {
        uint256 deployerKey  = vm.envUint("PRIVATE_KEY");
        address agentAddress = vm.envAddress("AGENT_ADDRESS");

        vm.startBroadcast(deployerKey);

        ChoreAgent choreAgent = new ChoreAgent(agentAddress);

        vm.stopBroadcast();

        console2.log("ChoreAgent deployed at:", address(choreAgent));
        console2.log("Agent address:         ", agentAddress);
        console2.log("Owner:                 ", vm.addr(deployerKey));
        console2.log("cUSD (mainnet):        ", CUSD_MAINNET);
        console2.log("cUSD (alfajores):      ", CUSD_ALFAJORES);
    }
}
