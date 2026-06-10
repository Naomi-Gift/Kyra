// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  IChoreVault
 * @notice Canonical public ABI for ChoreVault.
 *         All structs, events, custom errors, and external function signatures
 *         live here. No implementation.
 *
 * @dev    Note: `agent()` and `owner()` are declared as view functions here but
 *         are satisfied by the public state variables in AgentAuth. Solidity
 *         accepts this because a public variable auto-generates a getter that
 *         matches the view function signature.
 */
interface IChoreVault {

    // ─── Structs ──────────────────────────────────────────────────────────────

    /**
     * @param members          Ordered participant list (also the payout order).
     * @param amount           Per-member contribution per cycle (18-decimal cUSD wei).
     * @param interval         Minimum seconds between cycles.
     * @param nextCollection   Unix timestamp when the next collection is allowed.
     * @param rotationIndex    Index of the current payout recipient in `members`.
     * @param active           False once the group is disbanded.
     * @param pendingRelease   cUSD deposited to Aave for this group, awaiting release.
     */
    struct Group {
        address[] members;
        uint256   amount;
        uint256   interval;
        uint256   nextCollection;
        uint256   rotationIndex;
        bool      active;
        uint256   pendingRelease;
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    event GroupCreated(
        uint256 indexed groupId,
        address indexed creator,
        address[] members,
        uint256 amount,
        uint256 interval
    );
    event Collected(uint256 indexed groupId, address indexed member, uint256 amount);
    event CollectionFailed(uint256 indexed groupId, address indexed member, string reason);
    event PotReleased(
        uint256 indexed groupId,
        address indexed recipient,
        uint256 principal,
        uint256 yield,
        uint256 total
    );
    event TrustScoreUpdated(address indexed member, uint256 oldScore, uint256 newScore);
    event ExitRequested(uint256 indexed groupId, address indexed member);
    event ExitVoteCast(
        uint256 indexed groupId,
        address indexed subject,
        address indexed voter,
        bool    approve
    );
    event ExitApproved(uint256 indexed groupId, address indexed member);
    event ExitRejected(uint256 indexed groupId, address indexed member);
    event GroupDisbanded(uint256 indexed groupId);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error OnlyAgent();
    error OnlyOwner();
    error GroupNotFound();
    error GroupInactive();
    error TooEarlyToCollect();
    error NothingToRelease();
    error NotAMember();
    error AlreadyVoted();
    error NoExitRequestActive();
    error InvalidGroupSize();
    error InvalidAmount();
    error InvalidInterval();
    error ZeroAddress();
    error TransferFailed();

    // ─── External functions ───────────────────────────────────────────────────

    function createGroup(
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) external returns (uint256 groupId);

    function collect(uint256 groupId) external;

    function release(uint256 groupId) external;

    function requestExit(uint256 groupId) external;

    function voteExit(uint256 groupId, address member, bool approve) external;

    // ─── Views ────────────────────────────────────────────────────────────────

    function getTrustScore(address member) external view returns (uint256);

    function getGroup(uint256 groupId)
        external
        view
        returns (
            address[] memory members,
            uint256 amount,
            uint256 interval,
            uint256 nextCollection,
            uint256 rotationIndex,
            bool    active,
            uint256 pendingRelease
        );

    function groupCount() external view returns (uint256);

    function isMember(uint256 groupId, address account) external view returns (bool);
}
