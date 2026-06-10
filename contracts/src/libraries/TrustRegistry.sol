// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  TrustRegistry
 * @notice Library managing on-chain trust scores for savings circle members.
 *
 *  Score range : [0, 200]
 *  Initial     : 100
 *  On-time pay : +5  (capped at 200)
 *  Missed pay  : -20 (floored at 0)
 *
 *  Implementation note
 *  ───────────────────
 *  Raw storage for an uninitialised address is 0.  Because a penalised member
 *  can legitimately reach a score of 0, we cannot use 0 as the uninitialised
 *  sentinel.  Instead we store scores offset by 1 internally:
 *    stored value 0      → uninitialised (getTrustScore returns INITIAL_SCORE)
 *    stored value n > 0  → real score = n - 1
 *  This is fully hidden inside the library; callers never see the raw value.
 */
library TrustRegistry {

    uint256 public constant INITIAL_SCORE = 100;
    uint256 public constant MAX_SCORE     = 200;
    uint256 public constant MIN_SCORE     = 0;
    uint256 public constant REWARD        = 5;
    uint256 public constant PENALTY       = 20;
    uint256 public constant LOW_RISK      = 60;
    uint256 public constant HIGH_RISK     = 40;

    // ─── Internal helpers (offset encoding) ──────────────────────────────────

    /// @dev Read real score from storage (0 raw → INITIAL_SCORE).
    function _read(
        mapping(address => uint256) storage scores,
        address member
    ) private view returns (uint256) {
        uint256 raw = scores[member];
        return raw == 0 ? INITIAL_SCORE : raw - 1;
    }

    /// @dev Write real score to storage (offset by +1).
    function _write(
        mapping(address => uint256) storage scores,
        address member,
        uint256 score
    ) private {
        scores[member] = score + 1;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * @notice Initialise a member's score to INITIAL_SCORE if not yet set.
     *         No-op if the member has already been initialised (even if score==0).
     */
    function initialise(
        mapping(address => uint256) storage scores,
        address member
    ) internal {
        if (scores[member] == 0) {
            _write(scores, member, INITIAL_SCORE);
        }
    }

    /**
     * @notice Reward a member (+REWARD, capped at MAX_SCORE).
     * @return oldScore Score before the reward.
     * @return newScore Score after the reward.
     */
    function reward(
        mapping(address => uint256) storage scores,
        address member
    ) internal returns (uint256 oldScore, uint256 newScore) {
        oldScore = _read(scores, member);
        newScore = oldScore + REWARD > MAX_SCORE ? MAX_SCORE : oldScore + REWARD;
        _write(scores, member, newScore);
    }

    /**
     * @notice Penalise a member (-PENALTY, floored at MIN_SCORE / 0).
     * @return oldScore Score before the penalty.
     * @return newScore Score after the penalty.
     */
    function penalise(
        mapping(address => uint256) storage scores,
        address member
    ) internal returns (uint256 oldScore, uint256 newScore) {
        oldScore = _read(scores, member);
        newScore = oldScore < PENALTY ? MIN_SCORE : oldScore - PENALTY;
        _write(scores, member, newScore);
    }

    /**
     * @notice Read the current score (returns INITIAL_SCORE for uninitialised).
     */
    function get(
        mapping(address => uint256) storage scores,
        address member
    ) internal view returns (uint256) {
        return _read(scores, member);
    }

    /**
     * @notice Returns true if `score` is below the LOW_RISK threshold (< 60).
     */
    function isLowRisk(uint256 score) internal pure returns (bool) {
        return score < LOW_RISK;
    }

    /**
     * @notice Returns true if `score` is below the HIGH_RISK threshold (< 40).
     */
    function isHighRisk(uint256 score) internal pure returns (bool) {
        return score < HIGH_RISK;
    }
}
