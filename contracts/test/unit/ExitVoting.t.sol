// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ExitVoting} from "../../src/libraries/ExitVoting.sol";

/**
 * @notice Harness that exposes ExitVoting over real storage.
 */
contract ExitVotingHarness {
    mapping(uint256 => mapping(address => ExitVoting.Ballot)) public ballots;

    function open(uint256 gId, address member, uint256 groupSize) external {
        ExitVoting.open(ballots, gId, member, groupSize);
    }

    function vote(
        uint256 gId,
        address member,
        address voter,
        bool    approve
    ) external returns (bool resolved, bool passed) {
        return ExitVoting.vote(ballots, gId, member, voter, approve);
    }

    function isActive(uint256 gId, address member) external view returns (bool) {
        return ExitVoting.isActive(ballots, gId, member);
    }

    function hasVoted(uint256 gId, address member, address voter) external view returns (bool) {
        return ExitVoting.hasVoted(ballots, gId, member, voter);
    }

    function tally(uint256 gId, address member)
        external view returns (uint256 approvals, uint256 rejections, uint256 totalEligible)
    {
        return ExitVoting.tally(ballots, gId, member);
    }
}

contract ExitVotingTest is Test {
    ExitVotingHarness h;

    address member = makeAddr("member");   // exit requester
    address v1     = makeAddr("v1");
    address v2     = makeAddr("v2");
    address v3     = makeAddr("v3");
    address v4     = makeAddr("v4");

    uint256 constant GID = 0;
    // 5-member group → totalEligible = 4 → majority = 3

    function setUp() public {
        h = new ExitVotingHarness();
    }

    // ─── open ─────────────────────────────────────────────────────────────────

    function test_open_setsActiveTrue() public {
        h.open(GID, member, 5);
        assertTrue(h.isActive(GID, member));
        (,, uint256 total) = h.tally(GID, member);
        assertEq(total, 4);
    }

    function test_open_revertIfAlreadyOpen() public {
        h.open(GID, member, 5);
        vm.expectRevert("ExitVoting: ballot already open");
        h.open(GID, member, 5);
    }

    // ─── vote ─────────────────────────────────────────────────────────────────

    function test_vote_approvalResolvesOnMajority() public {
        h.open(GID, member, 5); // majority = 3
        h.vote(GID, member, v1, true);
        h.vote(GID, member, v2, true);
        (bool resolved, bool passed) = h.vote(GID, member, v3, true);
        assertTrue(resolved);
        assertTrue(passed);
        assertFalse(h.isActive(GID, member));
    }

    function test_vote_rejectionResolvesOnMajority() public {
        h.open(GID, member, 5); // majority = 3
        h.vote(GID, member, v1, false);
        h.vote(GID, member, v2, false);
        (bool resolved, bool passed) = h.vote(GID, member, v3, false);
        assertTrue(resolved);
        assertFalse(passed);
        assertFalse(h.isActive(GID, member));
    }

    function test_vote_revertIfAlreadyVoted() public {
        h.open(GID, member, 5);
        h.vote(GID, member, v1, true);
        // v1 tries to vote again — should revert
        vm.expectRevert("ExitVoting: already voted");
        h.vote(GID, member, v1, true);
    }

    function test_vote_requesterCannotVoteOnOwnExit() public {
        h.open(GID, member, 5);
        vm.expectRevert("ExitVoting: requester cannot vote on own exit");
        h.vote(GID, member, member, true);
    }

    function test_tally_returnsCorrectCounts() public {
        h.open(GID, member, 5);
        h.vote(GID, member, v1, true);
        h.vote(GID, member, v2, false);
        (uint256 approvals, uint256 rejections, uint256 total) = h.tally(GID, member);
        assertEq(approvals,   1);
        assertEq(rejections,  1);
        assertEq(total,       4);
    }

    function test_isActive_falseAfterResolution() public {
        h.open(GID, member, 5); // majority = 3
        h.vote(GID, member, v1, true);
        h.vote(GID, member, v2, true);
        h.vote(GID, member, v3, true); // resolves
        assertFalse(h.isActive(GID, member));
    }
}
