// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  IChoreVault
 * @notice Public ABI for ChoreVault — all structs, events, custom errors and
 *         external function signatures. No implementation lives here.
 */
interface IChoreVault {
    // ─── Structs ──────────────────────────────────────────────────────────────

    /**
     * @notice Represents a single savings circle.
     * @param members         Ordered list of participant addresses (also payout order).
     * @param amount          Contribution each member makes per cycle (18-decimal wei).
     * @param interval        Time between cycles in seconds.
     * @param nextCollection  Unix timestamp when the next collection is allowed.
     * @param rotationIndex   Index into `members` of the current payout recipient.
     * @param active          False once the group is disbanded.
     */
    struct Group {
        address[] members;
        uint256   amount;
        uint256   interval;
        uint256   nextCollection;
        uint256   rotationIndex;
        bool      active;
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a new savings group is created.
    event GroupCreated(
        uint256 indexed groupId,
        address indexed creator,
        address[] members,
        uint256 amount,
        uint256 interval
    );

    /// @notice Emitted on a successful individual collection.
    event Collected(uint256 indexed groupId, address indexed member, uint256 amount);

    /// @notice Emitted when a member's collection fails (e.g. insufficient allowance).
    event CollectionFailed(uint256 indexed groupId, address indexed member, string reason);

    /// @notice Emitted when the pot is released to the current rotation recipient.
    event PotReleased(
        uint256 indexed groupId,
        address indexed recipient,
        uint256 principal,
        uint256 yield,
        uint256 total
    );

    /// @notice Emitted whenever a member's trust score changes.
    event TrustScoreUpdated(
        address indexed member,
        uint256 oldScore,
        uint256 newScore
    );

    /// @notice Emitted when a member requests to leave a group.
    event ExitRequested(uint256 indexed groupId, address indexed member);

    /// @notice Emitted when another member casts a vote on an exit request.
    event ExitVoteCast(
        uint256 indexed groupId,
        address indexed subject,
        address indexed voter,
        bool   approve
    );

    /// @notice Emitted when an exit vote resolves in favour of the requester.
    event ExitApproved(uint256 indexed groupId, address indexed member);

    /// @notice Emitted when an exit vote resolves against the requester.
    event ExitRejected(uint256 indexed groupId, address indexed member);

    /// @notice Emitted when a group falls below minimum membership and is disbanded.
    event GroupDisbanded(uint256 indexed groupId);

    // ─── Errors ───────────────────────────────────────────────────────────────

    /// @notice Caller is not the registered agent.
    error OnlyAgent();

    /// @notice The referenced groupId does not exist.
    error GroupNotFound();

    /// @notice The group is no longer active.
    error GroupInactive();

    /// @notice A collection was attempted before the cycle interval has elapsed.
    error TooEarlyToCollect();

    /// @notice Caller or referenced address is not a member of the group.
    error NotAMember();

    /// @notice The caller has already cast a vote in this ballot.
    error AlreadyVoted();

    /// @notice There is no open exit request for the referenced member.
    error NoExitRequestActive();

    /// @notice Group size is outside the allowed [2, 50] range.
    error InvalidGroupSize();

    /// @notice Contribution amount is zero.
    error InvalidAmount();

    /// @notice Cycle interval is outside the allowed [1 day, 365 days] range.
    error InvalidInterval();

    /// @notice A zero address was provided where one is not permitted.
    error ZeroAddress();

    // ─── External functions ───────────────────────────────────────────────────

    /**
     * @notice Create a new savings circle.
     * @param members      Ordered list of member addresses (2–50).
     * @param amount       cUSD contribution per member per cycle (must be > 0).
     * @param intervalDays Cycle length in days (1–365).
     * @return groupId     The ID of the newly created group.
     */
    function createGroup(
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) external returns (uint256 groupId);

    /**
     * @notice Collect contributions from every member of a group and deposit
     *         the proceeds into Aave.  Only callable by the agent.
     * @param groupId The group to collect for.
     */
    function collect(uint256 groupId) external;

    /**
     * @notice Withdraw the pot from Aave and send it to the current rotation
     *         recipient.  Only callable by the agent.
     * @param groupId The group to release for.
     */
    function release(uint256 groupId) external;

    /**
     * @notice A member requests to leave their group democratically.
     * @param groupId The group the caller wishes to exit.
     */
    function requestExit(uint256 groupId) external;

    /**
     * @notice Cast a vote on an open exit request.
     * @param groupId The group containing the exit request.
     * @param member  The address that opened the exit request.
     * @param approve True to approve the exit, false to reject.
     */
    function voteExit(uint256 groupId, address member, bool approve) external;

    /**
     * @notice Returns a member's trust score (defaults to 100 if unset).
     * @param member The address to query.
     */
    function getTrustScore(address member) external view returns (uint256);

    /**
     * @notice Returns the full state of a group.
     * @param groupId The group to query.
     */
    function getGroup(uint256 groupId)
        external
        view
        returns (
            address[] memory members,
            uint256 amount,
            uint256 interval,
            uint256 nextCollection,
            uint256 rotationIndex,
            bool    active
        );

    /**
     * @notice Total number of groups ever created.
     */
    function groupCount() external view returns (uint256);

    /**
     * @notice Returns true if `account` is a member of `groupId`.
     */
    function isMember(uint256 groupId, address account) external view returns (bool);
}
