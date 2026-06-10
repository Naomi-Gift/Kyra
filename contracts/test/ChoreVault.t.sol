// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ChoreVault}   from "../src/ChoreVault.sol";
import {IChoreVault}  from "../src/interfaces/IChoreVault.sol";
import {MockERC20}    from "../mocks/MockERC20.sol";
import {MockAavePool} from "../mocks/MockAavePool.sol";

/**
 * @title  ChoreVaultTest — integration tests
 * @notice Events are redeclared here so vm.expectEmit can match them
 *         without the test contract needing to implement IChoreVault.
 */
contract ChoreVaultTest is Test {

    // ── Redeclare events so vm.expectEmit works ──────────────────────────────
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

    // ── Contracts ─────────────────────────────────────────────────────────────
    ChoreVault   vault;
    MockERC20    token;
    MockAavePool aave;

    address agent = makeAddr("agent");
    address a     = makeAddr("alice");
    address b     = makeAddr("bob");
    address c     = makeAddr("carol");
    address d     = makeAddr("dave");
    address e     = makeAddr("eve");

    address[] members5;

    uint256 constant AMOUNT   = 100e18;
    uint256 constant INTERVAL = 7;        // days
    uint256 constant SEED     = 10_000e18;
    uint256 constant YIELD    = 1e18;     // MockAavePool fixed bonus per withdraw

    // ── setUp ─────────────────────────────────────────────────────────────────

    function setUp() public {
        token    = new MockERC20("Celo Dollar", "cUSD");
        aave     = new MockAavePool(address(token));
        vault    = new ChoreVault(agent, address(token), address(aave));
        members5 = [a, b, c, d, e];

        // Fund members and max-approve vault
        for (uint256 i; i < members5.length; i++) {
            token.mint(members5[i], SEED);
            vm.prank(members5[i]);
            token.approve(address(vault), type(uint256).max);
        }
        // Pre-fund pool so it can always pay yield
        token.mint(address(aave), 1_000e18);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _create() internal returns (uint256 gId) {
        gId = vault.createGroup(members5, AMOUNT, INTERVAL);
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

    // ── createGroup ───────────────────────────────────────────────────────────

    function test_createGroup_succeeds() public {
        uint256 gId = _create();
        assertEq(gId, 0);
        assertEq(vault.groupCount(), 1);
        for (uint256 i; i < members5.length; i++) {
            assertTrue(vault.isMember(gId, members5[i]));
        }
        assertFalse(vault.isMember(gId, address(0xDEAD)));
        // Trust scores initialised at 100
        for (uint256 i; i < members5.length; i++) {
            assertEq(vault.getTrustScore(members5[i]), 100);
        }
    }

    function test_createGroup_revertInvalidMembers() public {
        address[] memory one = new address[](1);
        one[0] = a;
        vm.expectRevert(IChoreVault.InvalidGroupSize.selector);
        vault.createGroup(one, AMOUNT, INTERVAL);
    }

    // ── collect ───────────────────────────────────────────────────────────────

    function test_collect_success_allMembers() public {
        uint256 gId = _create();
        vm.warp(block.timestamp + INTERVAL * 1 days + 1);

        // Expect TrustScoreUpdated for every member (old=100 → new=105)
        for (uint256 i; i < members5.length; i++) {
            vm.expectEmit(true, false, false, true);
            emit TrustScoreUpdated(members5[i], 100, 105);
        }

        vm.prank(agent);
        vault.collect(gId);

        // Balances reduced by AMOUNT
        for (uint256 i; i < members5.length; i++) {
            assertEq(token.balanceOf(members5[i]), SEED - AMOUNT);
            assertEq(vault.getTrustScore(members5[i]), 105);
        }
    }

    function test_collect_partialFailure() public {
        uint256 gId = _create();

        // Revoke carol's allowance — her collection should fail gracefully
        vm.prank(c);
        token.approve(address(vault), 0);

        vm.warp(block.timestamp + INTERVAL * 1 days + 1);

        vm.expectEmit(true, true, false, false);
        emit CollectionFailed(gId, c, "transferFrom failed");

        vm.prank(agent);
        vault.collect(gId);

        // Others paid
        assertEq(token.balanceOf(a), SEED - AMOUNT);
        assertEq(token.balanceOf(b), SEED - AMOUNT);
        // Carol kept tokens
        assertEq(token.balanceOf(c), SEED);
        // Carol penalised: 100 - 20 = 80
        assertEq(vault.getTrustScore(c), 80);
    }

    function test_collect_revertTooEarly() public {
        uint256 gId = _create();
        vm.prank(agent);
        vm.expectRevert(IChoreVault.TooEarlyToCollect.selector);
        vault.collect(gId);
    }

    function test_collect_revertNotAgent() public {
        uint256 gId = _create();
        vm.warp(block.timestamp + INTERVAL * 1 days + 1);
        vm.prank(a);
        vm.expectRevert(IChoreVault.OnlyAgent.selector);
        vault.collect(gId);
    }

    function test_collect_revertGroupInactive() public {
        vm.prank(agent);
        vm.expectRevert(IChoreVault.GroupNotFound.selector);
        vault.collect(99);
    }

    // ── release ───────────────────────────────────────────────────────────────

    function test_release_sendsCorrectAmount() public {
        uint256 gId = _create();
        _warpAndCollect(gId);

        uint256 balBefore = token.balanceOf(a); // alice is round-0 recipient

        vm.expectEmit(true, true, false, true);
        emit PotReleased(gId, a, AMOUNT * 5, YIELD, AMOUNT * 5 + YIELD);

        _release(gId);

        assertEq(token.balanceOf(a), balBefore + AMOUNT * 5 + YIELD);
    }

    function test_release_advancesRotationIndex() public {
        uint256 gId = _create();
        _warpAndCollect(gId);
        _release(gId);
        (,,,, uint256 rot,) = vault.getGroup(gId);
        assertEq(rot, 1); // bob is next
    }

    function test_release_revertNotAgent() public {
        uint256 gId = _create();
        vm.prank(a);
        vm.expectRevert(IChoreVault.OnlyAgent.selector);
        vault.release(gId);
    }

    // ── Exit flow ─────────────────────────────────────────────────────────────

    function test_exitFlow_approved() public {
        uint256 gId = _create();

        vm.prank(a);
        vault.requestExit(gId);

        // 5-member group → totalEligible = 4 → majority = 3
        vm.prank(b); vault.voteExit(gId, a, true);
        vm.prank(c); vault.voteExit(gId, a, true);

        vm.expectEmit(true, true, false, false);
        emit ExitApproved(gId, a);

        vm.prank(d); vault.voteExit(gId, a, true); // 3rd approve → resolves

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

        vm.prank(d); vault.voteExit(gId, a, false); // 3rd reject → resolves

        assertTrue(vault.isMember(gId, a)); // still a member
    }

    function test_exitFlow_revertNotMember() public {
        uint256 gId = _create();
        vm.prank(address(0xDEAD));
        vm.expectRevert(IChoreVault.NotAMember.selector);
        vault.requestExit(gId);
    }

    function test_exitFlow_revertAlreadyVoted() public {
        uint256 gId = _create();
        vm.prank(a); vault.requestExit(gId);
        vm.prank(b); vault.voteExit(gId, a, true);

        vm.prank(b);
        vm.expectRevert(IChoreVault.AlreadyVoted.selector);
        vault.voteExit(gId, a, true);
    }

    // ── Full 2-cycle flow ─────────────────────────────────────────────────────

    function test_fullCycle_twoRounds() public {
        uint256 gId = _create();

        // ─ Round 0: alice receives ────────────────────────────────────────────
        _warpAndCollect(gId);

        uint256 aliceBefore = token.balanceOf(a);
        _release(gId);
        assertEq(token.balanceOf(a), aliceBefore + AMOUNT * 5 + YIELD, "round 0");

        (,,,, uint256 rot0,) = vault.getGroup(gId);
        assertEq(rot0, 1, "rotation to bob");

        // ─ Round 1: bob receives ──────────────────────────────────────────────
        _warpAndCollect(gId);

        uint256 bobBefore = token.balanceOf(b);
        _release(gId);
        assertEq(token.balanceOf(b), bobBefore + AMOUNT * 5 + YIELD, "round 1");

        (,,,, uint256 rot1,) = vault.getGroup(gId);
        assertEq(rot1, 2, "rotation to carol");
    }
}
