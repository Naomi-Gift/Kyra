// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {TrustRegistry} from "../../src/libraries/TrustRegistry.sol";

/**
 * @notice Unit tests for TrustRegistry.
 *         Uses a bare mapping in a helper contract so the library functions
 *         can modify storage.
 */
contract TrustRegistryHarness {
    mapping(address => uint256) public scores;

    function initialise(address m)              external { TrustRegistry.initialise(scores, m); }
    function reward(address m)                  external returns (uint256 o, uint256 n) { return TrustRegistry.reward(scores, m); }
    function penalise(address m)                external returns (uint256 o, uint256 n) { return TrustRegistry.penalise(scores, m); }
    function isLowRisk(uint256 s)   external pure returns (bool) { return TrustRegistry.isLowRisk(s); }
    function isHighRisk(uint256 s)  external pure returns (bool) { return TrustRegistry.isHighRisk(s); }
    function getScore(address m)    external view returns (uint256) { return TrustRegistry.get(scores, m); }
}

contract TrustRegistryTest is Test {
    TrustRegistryHarness h;
    address constant ALICE = address(0xA11CE);

    function setUp() public {
        h = new TrustRegistryHarness();
    }

    function test_initialScore_isHundred() public {
        h.initialise(ALICE);
        assertEq(h.getScore(ALICE), 100);
    }

    function test_reward_incrementsByFive() public {
        h.initialise(ALICE);
        (uint256 old, uint256 nw) = h.reward(ALICE);
        assertEq(old, 100);
        assertEq(nw,  105);
        assertEq(h.getScore(ALICE), 105);
    }

    function test_reward_capsAtTwoHundred() public {
        h.initialise(ALICE);
        // Reward 20 times: 100 + 5*20 = 200 (capped)
        for (uint256 i = 0; i < 25; i++) h.reward(ALICE);
        assertEq(h.getScore(ALICE), 200);
    }

    function test_penalise_decreasesByTwenty() public {
        h.initialise(ALICE);
        (uint256 old, uint256 nw) = h.penalise(ALICE);
        assertEq(old, 100);
        assertEq(nw,  80);
        assertEq(h.getScore(ALICE), 80);
    }

    function test_penalise_floorsAtZero() public {
        h.initialise(ALICE);
        // Penalise 6 times: 100 - 20*5 = 0 (floored)
        for (uint256 i = 0; i < 6; i++) h.penalise(ALICE);
        assertEq(h.getScore(ALICE), 0);
    }

    function test_isLowRisk_belowSixty() public {
        assertEq(h.isLowRisk(59), true);
        assertEq(h.isLowRisk(60), false);
        assertEq(h.isLowRisk(61), false);
    }

    function test_isHighRisk_belowForty() public {
        assertEq(h.isHighRisk(39), true);
        assertEq(h.isHighRisk(40), false);
        assertEq(h.isHighRisk(41), false);
    }

    function test_initialise_skipsIfAlreadySet() public {
        h.initialise(ALICE);
        h.reward(ALICE);                   // score → 105
        h.initialise(ALICE);               // should be no-op
        assertEq(h.getScore(ALICE), 105);  // unchanged
    }
}
