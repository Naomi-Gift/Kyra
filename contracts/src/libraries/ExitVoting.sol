// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IKyraVault} from "../interfaces/IKyraVault.sol";

/**
 * @title  ExitVoting
 * @notice Library managing the democratic exit-vote lifecycle for savings
 *         circle members.
 *
 *  Flow:
 *   1. A member calls requestExit() → KyraVault calls open().
 *   2. Other members call voteExit() → KyraVault calls vote().
 *      vote() resolves immediately when a mathematical majority is guaranteed
 *      (either for or against), returning (resolved=true, passed=true/false).
 *   3. The ballot is closed once resolved.
 */
library ExitVoting {
    // ─── Struct ───────────────────────────────────────────────────────────────

    /**
     * @notice State for one active or resolved exit ballot.
     * @param active          True while the vote is open.
     * @param approvals       Number of approve votes cast.
     * @param rejections      Number of reject votes cast.
     * @param totalEligible   Total votes that may be cast (groupSize − 1).
     * @param voted           Per-voter record to prevent double-voting.
     */
    struct Ballot {
        bool    active;
        uint256 approvals;
        uint256 rejections;
        uint256 totalEligible;
        mapping(address => bool) voted;
    }

    // ─── Functions ────────────────────────────────────────────────────────────

    /**
     * @notice Open a new exit ballot for `member` in `groupId`.
     *         Reverts if a ballot is already active for this (group, member) pair.
     * @param ballots        The nested exit-ballot mapping.
     * @param groupId        The group in which the exit is requested.
     * @param member         The member who wants to leave.
     * @param totalGroupSize Current number of members in the group (including requester).
     */
    function open(
        mapping(uint256 => mapping(address => Ballot)) storage ballots,
        uint256 groupId,
        address member,
        uint256 totalGroupSize
    ) internal {
        Ballot storage b = ballots[groupId][member];
        require(!b.active, "ExitVoting: ballot already open");

        b.active        = true;
        b.approvals     = 0;
        b.rejections    = 0;
        b.totalEligible = totalGroupSize - 1; // requester cannot vote
    }

    /**
     * @notice Cast a vote on the open exit ballot for `member` in `groupId`.
     *         Resolves immediately if a majority is mathematically guaranteed.
     *         The exit requester is not permitted to vote on their own ballot.
     *
     * @param ballots  The nested exit-ballot mapping.
     * @param groupId  The group containing the ballot.
     * @param member   The member whose exit is being voted on.
     * @param voter    The address casting the vote.
     * @param approve  True to approve the exit, false to reject.
     * @return resolved  True if this vote caused the ballot to close.
     * @return passed    True if the exit was approved (only meaningful when resolved).
     */
    function vote(
        mapping(uint256 => mapping(address => Ballot)) storage ballots,
        uint256 groupId,
        address member,
        address voter,
        bool    approve
    ) internal returns (bool resolved, bool passed) {
        // Requester cannot vote on their own exit
        require(voter != member, "ExitVoting: requester cannot vote on own exit");

        Ballot storage b = ballots[groupId][member];

        // Prevent double-voting
        require(!b.voted[voter], "ExitVoting: already voted");

        // Record vote
        if (approve) {
            b.approvals++;
        } else {
            b.rejections++;
        }
        b.voted[voter] = true;

        // Majority threshold = floor(totalEligible / 2) + 1
        uint256 majority = (b.totalEligible / 2) + 1;

        if (b.approvals >= majority) {
            // Approval majority guaranteed
            b.active  = false;
            resolved  = true;
            passed    = true;
        } else if (b.rejections >= majority) {
            // Rejection majority guaranteed
            b.active  = false;
            resolved  = true;
            passed    = false;
        } else {
            resolved = false;
            passed   = false;
        }
    }

    /**
     * @notice Returns true if an exit ballot is currently active for `member`.
     */
    function isActive(
        mapping(uint256 => mapping(address => Ballot)) storage ballots,
        uint256 groupId,
        address member
    ) internal view returns (bool) {
        return ballots[groupId][member].active;
    }

    /**
     * @notice Returns true if `voter` has already voted in the ballot for `member`.
     */
    function hasVoted(
        mapping(uint256 => mapping(address => Ballot)) storage ballots,
        uint256 groupId,
        address member,
        address voter
    ) internal view returns (bool) {
        return ballots[groupId][member].voted[voter];
    }

    /**
     * @notice Returns the current vote tally for `member`'s exit ballot.
     * @return approvals      Number of approve votes so far.
     * @return rejections     Number of reject votes so far.
     * @return totalEligible  Maximum number of votes that can be cast.
     */
    function tally(
        mapping(uint256 => mapping(address => Ballot)) storage ballots,
        uint256 groupId,
        address member
    ) internal view returns (uint256 approvals, uint256 rejections, uint256 totalEligible) {
        Ballot storage b = ballots[groupId][member];
        return (b.approvals, b.rejections, b.totalEligible);
    }
}
