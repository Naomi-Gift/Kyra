// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {GroupManager} from "../../src/libraries/GroupManager.sol";
import {IKyraVault}  from "../../src/interfaces/IKyraVault.sol";

/**
 * @notice Harness that exposes GroupManager library functions over real storage.
 */
contract GroupManagerHarness {
    mapping(uint256 => IKyraVault.Group) public groups;

    function validateCreation(
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) external pure {
        GroupManager.validateCreation(members, amount, intervalDays);
    }

    function create(
        uint256 groupId,
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) external {
        GroupManager.create(groups, groupId, members, amount, intervalDays);
    }

    function advanceCollection(uint256 groupId) external {
        GroupManager.advanceCollection(groups, groupId);
    }

    function advanceRotation(uint256 groupId) external {
        GroupManager.advanceRotation(groups, groupId);
    }

    function removeMember(uint256 groupId, address member) external {
        GroupManager.removeMember(groups, groupId, member);
    }

    function isMember(uint256 groupId, address account) external view returns (bool) {
        return GroupManager.isMember(groups, groupId, account);
    }

    function currentRecipient(uint256 groupId) external view returns (address) {
        return GroupManager.currentRecipient(groups, groupId);
    }

    function expectedPotSize(uint256 groupId) external view returns (uint256) {
        return GroupManager.expectedPotSize(groups, groupId);
    }

    function isDueForCollection(uint256 groupId) external view returns (bool) {
        return GroupManager.isDueForCollection(groups, groupId);
    }

    function getMembers(uint256 groupId) external view returns (address[] memory) {
        return groups[groupId].members;
    }

    function getRotationIndex(uint256 groupId) external view returns (uint256) {
        return groups[groupId].rotationIndex;
    }

    function getNextCollection(uint256 groupId) external view returns (uint256) {
        return groups[groupId].nextCollection;
    }

    function isActive(uint256 groupId) external view returns (bool) {
        return groups[groupId].active;
    }
}

contract GroupManagerTest is Test {
    GroupManagerHarness h;

    address alice = makeAddr("alice");
    address bob   = makeAddr("bob");
    address carol = makeAddr("carol");

    address[] members3;
    uint256 constant AMOUNT   = 25e18;
    uint256 constant INTERVAL = 7; // days

    function setUp() public {
        h        = new GroupManagerHarness();
        members3 = [alice, bob, carol];
    }

    // ─── create ───────────────────────────────────────────────────────────────

    function test_create_storesMembers() public {
        h.create(0, members3, AMOUNT, INTERVAL);
        address[] memory m = h.getMembers(0);
        assertEq(m.length, 3);
        assertEq(m[0], alice);
        assertEq(m[1], bob);
        assertEq(m[2], carol);
    }

    function test_create_setsNextCollection() public {
        uint256 before = block.timestamp;
        h.create(0, members3, AMOUNT, INTERVAL);
        uint256 expected = before + INTERVAL * 1 days;
        assertEq(h.getNextCollection(0), expected);
    }

    // ─── advanceCollection ────────────────────────────────────────────────────

    function test_advanceCollection_updatesTimestamp() public {
        h.create(0, members3, AMOUNT, INTERVAL);
        vm.warp(block.timestamp + INTERVAL * 1 days + 1);
        uint256 before = block.timestamp;
        h.advanceCollection(0);
        assertEq(h.getNextCollection(0), before + INTERVAL * 1 days);
    }

    // ─── advanceRotation ──────────────────────────────────────────────────────

    function test_advanceRotation_wrapsAround() public {
        h.create(0, members3, AMOUNT, INTERVAL);
        assertEq(h.getRotationIndex(0), 0);
        h.advanceRotation(0); assertEq(h.getRotationIndex(0), 1);
        h.advanceRotation(0); assertEq(h.getRotationIndex(0), 2);
        h.advanceRotation(0); assertEq(h.getRotationIndex(0), 0); // wraps
    }

    // ─── removeMember ─────────────────────────────────────────────────────────

    function test_removeMember_swapAndPop() public {
        h.create(0, members3, AMOUNT, INTERVAL);
        h.removeMember(0, alice); // alice was idx 0, carol swaps in
        address[] memory m = h.getMembers(0);
        assertEq(m.length, 2);
        // carol should have swapped to index 0
        assertFalse(h.isMember(0, alice));
        assertTrue(h.isMember(0, bob));
        assertTrue(h.isMember(0, carol));
    }

    function test_removeMember_adjustsRotationIndex() public {
        // Create with 4 members so we can remove without disbanding
        address dave = makeAddr("dave");
        address[] memory m4 = new address[](4);
        m4[0] = alice; m4[1] = bob; m4[2] = carol; m4[3] = dave;
        h.create(0, m4, AMOUNT, INTERVAL);

        // Advance rotation to index 3 (dave)
        h.advanceRotation(0);
        h.advanceRotation(0);
        h.advanceRotation(0);
        assertEq(h.getRotationIndex(0), 3);

        // Remove dave (index 3) — rotationIndex should clamp to 0
        h.removeMember(0, dave);
        assertLt(h.getRotationIndex(0), h.getMembers(0).length);
    }

    function test_removeMember_disbands_whenBelowMinimum() public {
        // Only 2 members — removing one should disband
        address[] memory m2 = new address[](2);
        m2[0] = alice; m2[1] = bob;
        h.create(0, m2, AMOUNT, INTERVAL);
        h.removeMember(0, alice);
        assertFalse(h.isActive(0));
    }

    // ─── isMember ─────────────────────────────────────────────────────────────

    function test_isMember_trueAndFalse() public {
        h.create(0, members3, AMOUNT, INTERVAL);
        assertTrue(h.isMember(0, alice));
        assertFalse(h.isMember(0, address(0xDEAD)));
    }

    // ─── validateCreation ────────────────────────────────────────────────────

    function test_validateCreation_revertOnDuplicate() public {
        address[] memory dup = new address[](3);
        dup[0] = alice; dup[1] = alice; dup[2] = carol;
        vm.expectRevert(IKyraVault.InvalidGroupSize.selector);
        h.validateCreation(dup, AMOUNT, INTERVAL);
    }

    function test_validateCreation_revertOnZeroAddress() public {
        address[] memory z = new address[](2);
        z[0] = alice; z[1] = address(0);
        vm.expectRevert(IKyraVault.ZeroAddress.selector);
        h.validateCreation(z, AMOUNT, INTERVAL);
    }

    function test_validateCreation_revertOnTooFewMembers() public {
        address[] memory one = new address[](1);
        one[0] = alice;
        vm.expectRevert(IKyraVault.InvalidGroupSize.selector);
        h.validateCreation(one, AMOUNT, INTERVAL);
    }
}
