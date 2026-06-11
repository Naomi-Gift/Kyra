// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {KyraVault}   from "../src/KyraVault.sol";
import {IKyraVault}  from "../src/interfaces/IKyraVault.sol";
import {MockERC20}    from "../mocks/MockERC20.sol";
import {MockAavePool} from "../mocks/MockAavePool.sol";

contract KyraVaultTest is Test {

    // Redeclare events for vm.expectEmit (avoids inheriting IKyraVault)
    event GroupCreated(uint256 indexed groupId, address indexed creator,
        address[] members, uint256 amount, uint256 interval);
    event Collected(uint256 indexed groupId, address indexed member, uint256 amount);
    event CollectionFailed(uint256 indexed groupId, address indexed member, string reason);
    event PotReleased(uint256 indexed groupId, address indexed recipient,
        uint256 principal, uint256 yield, uint256 total);
    event TrustScoreUpdated(address indexed member, uint256 oldScore, uint256 newScore);
    event ExitRequested(uint256 indexed groupId, address indexed member);
    event ExitVoteCast(uint256 indexed groupId, address indexed subject,
        address indexed voter, bool approve);
    event ExitApproved(uint256 indexed groupId, address indexed member);
    event ExitRejected(uint256 indexed groupId, address indexed member);
    event GroupDisbanded(uint256 indexed groupId);

    KyraVault   vault;
    MockERC20    token;
    MockAavePool aave;

    address owner = makeAddr("owner");
    address agent = makeAddr("agent");
    address a     = makeAddr("alice");
    address b     = makeAddr("bob");
    address c     = makeAddr("carol");
    address d     = makeAddr("dave");
    address e     = makeAddr("eve");

    address[] members5;

    uint256 constant AMOUNT   = 100e18;
    uint256 constant INTERVAL = 7;
    uint256 constant SEED     = 10_000e18;
    uint256 constant YIELD    = 1e18;

    function setUp() public {
        token    = new MockERC20("Celo Dollar", "cUSD");
        aave     = new MockAavePool(address(token));
        vault    = new KyraVault(agent, owner, address(token), address(aave));
        members5 = [a, b, c, d, e];

        for (uint256 i; i < members5.length; i++) {
            token.mint(members5[i], SEED);
            vm.prank(members5[i]);
            token.approve(address(vault), type(uint256).max);
        }
        token.mint(address(aave), 1_000e18);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function _create() internal returns (uint256) {
        return vault.createGroup(members5, AMOUNT, INTERVAL);
    }

    function _warpAndCollect(uint256 gId) internal {
        vm.warp(block.timestamp + INTERVAL * 1 days + 1);
        vm.prank(agent);
        vault.collect(gId);
    }

    function _release(uint256 gId) internal {
        vm.prank(agent);
        vault.release(gId);
    }

    function _rotationIndex(uint256 gId) internal view returns (uint256) {
        (,,,, uint256 rot,,) = vault.getGroup(gId);
        return rot;
    }

    // ─── createGroup ──────────────────────────────────────────────────────────

    function test_createGroup_succeeds() public {
        uint256 gId = _create();
        assertEq(gId, 0);
        assertEq(vault.groupCount(), 1);
        for (uint256 i; i < members5.length; i++) {
            assertTrue(vault.isMember(gId, members5[i]));
            assertEq(vault.getTrustScore(members5[i]), 100);
        }
        assertFalse(vault.isMember(gId, address(0xDEAD)));
    }

    function test_createGroup_revertInvalidMembers() public {
        address[] memory one = new address[](1);
        one[0] = a;
        vm.expectRevert(IKyraVault.InvalidGroupSize.selector);
        vault.createGroup(one, AMOUNT, INTERVAL);
    }

    // ─── collect ──────────────────────────────────────────────────────────────

    function test_collect_success_allMembers() public {
        uint256 gId = _create();
        vm.warp(block.timestamp + INTERVAL * 1 days + 1);

        for (uint256 i; i < members5.length; i++) {
            vm.expectEmit(true, false, false, true);
            emit TrustScoreUpdated(members5[i], 100, 105);
        }

        vm.prank(agent);
        vault.collect(gId);

        for (uint256 i; i < members5.length; i++) {
            assertEq(token.balanceOf(members5[i]), SEED - AMOUNT);
            assertEq(vault.getTrustScore(members5[i]), 105);
        }

        // pendingRelease should equal total collected
        (,,,,,, uint256 pending) = vault.getGroup(gId);
        assertEq(pending, AMOUNT * 5);
    }

    function test_collect_partialFailure() public {
        uint256 gId = _create();
        vm.prank(c);
        token.approve(address(vault), 0);

        vm.warp(block.timestamp + INTERVAL * 1 days + 1);

        vm.expectEmit(true, true, false, false);
        emit CollectionFailed(gId, c, "transferFrom failed");

        vm.prank(agent);
        vault.collect(gId);

        assertEq(token.balanceOf(a), SEED - AMOUNT);
        assertEq(token.balanceOf(c), SEED);
        assertEq(vault.getTrustScore(c), 80);

        (,,,,,, uint256 pending) = vault.getGroup(gId);
        assertEq(pending, AMOUNT * 4); // 4 of 5 collected
    }

    function test_collect_revertTooEarly() public {
        uint256 gId = _create();
        vm.prank(agent);
        vm.expectRevert(IKyraVault.TooEarlyToCollect.selector);
        vault.collect(gId);
    }

    function test_collect_revertNotAgent() public {
        uint256 gId = _create();
        vm.warp(block.timestamp + INTERVAL * 1 days + 1);
        vm.prank(a);
        vm.expectRevert(IKyraVault.OnlyAgent.selector);
        vault.collect(gId);
    }

    function test_collect_revertGroupInactive() public {
        vm.prank(agent);
        vm.expectRevert(IKyraVault.GroupNotFound.selector);
        vault.collect(99);
    }

    function test_collect_allFailures_doesNotAdvanceIfZero() public {
        uint256 gId = _create();
        // Revoke ALL member approvals
        for (uint256 i; i < members5.length; i++) {
            vm.prank(members5[i]);
            token.approve(address(vault), 0);
        }
        vm.warp(block.timestamp + INTERVAL * 1 days + 1);
        vm.prank(agent);
        vault.collect(gId); // should not revert — just emits failures

        // pendingRelease must be 0 (nothing collected)
        (,,,,,, uint256 pending) = vault.getGroup(gId);
        assertEq(pending, 0);
        // nextCollection should still advance (cycle still moves forward)
        (,,, uint256 nextColl,,,) = vault.getGroup(gId);
        assertGt(nextColl, block.timestamp);
    }

    // ─── release ──────────────────────────────────────────────────────────────

    function test_release_sendsCorrectAmount() public {
        uint256 gId = _create();
        _warpAndCollect(gId);

        uint256 balBefore = token.balanceOf(a);

        vm.expectEmit(true, true, false, true);
        emit PotReleased(gId, a, AMOUNT * 5, YIELD, AMOUNT * 5 + YIELD);

        _release(gId);

        assertEq(token.balanceOf(a), balBefore + AMOUNT * 5 + YIELD);
    }

    function test_release_advancesRotationIndex() public {
        uint256 gId = _create();
        _warpAndCollect(gId);
        _release(gId);
        assertEq(_rotationIndex(gId), 1);
    }

    function test_release_revertNotAgent() public {
        uint256 gId = _create();
        vm.prank(a);
        vm.expectRevert(IKyraVault.OnlyAgent.selector);
        vault.release(gId);
    }

    function test_release_revertNothingToRelease() public {
        uint256 gId = _create();
        // No collect was called
        vm.prank(agent);
        vm.expectRevert(IKyraVault.NothingToRelease.selector);
        vault.release(gId);
    }

    // ─── Emergency agent rotation ──────────────────────────────────────────────

    function test_emergencyRotateAgent_byOwner() public {
        address newAgent = makeAddr("newAgent");
        vm.prank(owner);
        vault.emergencyRotateAgent(newAgent);
        assertEq(vault.agent(), newAgent);
    }

    function test_rotateAgent_byAgent() public {
        address newAgent = makeAddr("newAgent");
        vm.prank(agent);
        vault.rotateAgent(newAgent);
        assertEq(vault.agent(), newAgent);
    }

    function test_emergencyRotateAgent_revertNotOwner() public {
        vm.prank(a);
        vm.expectRevert(IKyraVault.OnlyOwner.selector);
        vault.emergencyRotateAgent(makeAddr("x"));
    }

    // ─── Exit flow ────────────────────────────────────────────────────────────

    function test_exitFlow_approved() public {
        uint256 gId = _create();

        vm.prank(a);
        vault.requestExit(gId);

        vm.prank(b); vault.voteExit(gId, a, true);
        vm.prank(c); vault.voteExit(gId, a, true);

        vm.expectEmit(true, true, false, false);
        emit ExitApproved(gId, a);

        vm.prank(d); vault.voteExit(gId, a, true);

        assertFalse(vault.isMember(gId, a));
    }

    function test_exitFlow_rejected() public {
        uint256 gId = _create();

        vm.prank(a);
        vault.requestExit(gId);

        vm.prank(b); vault.voteExit(gId, a, false);
        vm.prank(c); vault.voteExit(gId, a, false);

        vm.expectEmit(true, true, false, false);
        emit ExitRejected(gId, a);

        vm.prank(d); vault.voteExit(gId, a, false);

        assertTrue(vault.isMember(gId, a));
    }

    function test_exitFlow_revertNotMember() public {
        uint256 gId = _create();
        vm.prank(address(0xDEAD));
        vm.expectRevert(IKyraVault.NotAMember.selector);
        vault.requestExit(gId);
    }

    function test_exitFlow_revertAlreadyVoted() public {
        uint256 gId = _create();
        vm.prank(a); vault.requestExit(gId);
        vm.prank(b); vault.voteExit(gId, a, true);
        vm.prank(b);
        vm.expectRevert(IKyraVault.AlreadyVoted.selector);
        vault.voteExit(gId, a, true);
    }

    // ─── Full 2-cycle flow ────────────────────────────────────────────────────

    function test_fullCycle_twoRounds() public {
        uint256 gId = _create();

        // Round 0: alice receives
        _warpAndCollect(gId);
        uint256 aliceBefore = token.balanceOf(a);
        _release(gId);
        assertEq(token.balanceOf(a), aliceBefore + AMOUNT * 5 + YIELD, "round 0");
        assertEq(_rotationIndex(gId), 1, "rot to bob");

        // Round 1: bob receives
        _warpAndCollect(gId);
        uint256 bobBefore = token.balanceOf(b);
        _release(gId);
        assertEq(token.balanceOf(b), bobBefore + AMOUNT * 5 + YIELD, "round 1");
        assertEq(_rotationIndex(gId), 2, "rot to carol");
    }
}
