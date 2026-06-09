// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  ChoreAgent
 * @notice Trustless rotating savings circles (susu / tanda / chit fund) on Celo.
 *
 *  How it works
 *  ─────────────
 *  1.  Anyone calls `createGroup` to deploy a new savings round.
 *  2.  Each member calls `approve(choreAgent, amount)` on the cUSD token once.
 *  3.  The registered agent address calls `runCycle` every `cycleDurationSecs`.
 *      - It pulls `contributionAmount` cUSD from every member.
 *      - Sends the full pot to `payoutOrder[currentRound]`.
 *      - Advances `currentRound`.  When everyone has been paid, the group
 *        status flips to `Completed` and the cycle can optionally restart.
 *
 *  Security model
 *  ──────────────
 *  - The contract never holds funds — it only has transferFrom permission.
 *  - Only `agentAddress` may call `runCycle`.
 *  - Member allowances are the only authority the agent has.
 *  - Owner can rotate the agent address (key rotation / upgrade path).
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract ChoreAgent {
    // ─── Types ────────────────────────────────────────────────────────────────

    enum GroupStatus { Active, Collecting, Completed, Paused }

    struct Group {
        string   name;
        address  creator;
        address  cUSD;               // stablecoin token (Celo: 0x765DE816845861e75A25fCA122bb6898B8B1282a)
        uint256  contributionAmount; // per-member, per-cycle (18 decimals)
        uint256  cycleDurationSecs;  // e.g. 7 * 86400 for weekly
        uint256  lastCycleAt;        // unix timestamp of last successful cycle
        uint8    currentRound;       // 0-indexed, which member gets paid next
        GroupStatus status;
        address[] members;           // fixed order; also the payout order
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    address public agentAddress;

    uint256 public groupCount;
    mapping(uint256 => Group) private _groups;

    // groupId → member → has been removed
    mapping(uint256 => mapping(address => bool)) public isRemoved;

    // ─── Events ───────────────────────────────────────────────────────────────

    event GroupCreated(
        uint256 indexed groupId,
        string name,
        address indexed creator,
        uint256 contributionAmount,
        uint256 cycleDurationSecs,
        address[] members
    );

    event CycleRun(
        uint256 indexed groupId,
        uint8   round,
        address indexed recipient,
        uint256 potAmount,
        uint256 timestamp
    );

    event CollectionFailed(
        uint256 indexed groupId,
        address indexed member,
        string  reason
    );

    event GroupCompleted(uint256 indexed groupId);
    event GroupRestarted(uint256 indexed groupId);
    event AgentAddressUpdated(address indexed newAgent);
    event GroupPaused(uint256 indexed groupId);
    event GroupResumed(uint256 indexed groupId);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotOwner();
    error NotAgent();
    error GroupNotFound();
    error GroupNotActive();
    error TooEarlyToRunCycle(uint256 nextAllowedAt);
    error InvalidMembers();
    error ZeroAmount();
    error ZeroDuration();
    error TransferFailed();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _agentAddress) {
        owner        = msg.sender;
        agentAddress = _agentAddress;
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agentAddress) revert NotAgent();
        _;
    }

    // ─── Group management ─────────────────────────────────────────────────────

    /**
     * @notice Create a new savings group.
     * @param name               Human-readable group name.
     * @param cUSD               ERC-20 token used for contributions (Celo cUSD).
     * @param contributionAmount Amount each member contributes per cycle (wei).
     * @param cycleDurationSecs  Minimum seconds between cycles.
     * @param members            Ordered list of member addresses (also payout order).
     */
    function createGroup(
        string calldata name,
        address cUSD,
        uint256 contributionAmount,
        uint256 cycleDurationSecs,
        address[] calldata members
    ) external returns (uint256 groupId) {
        if (members.length < 2)          revert InvalidMembers();
        if (contributionAmount == 0)     revert ZeroAmount();
        if (cycleDurationSecs == 0)      revert ZeroDuration();

        groupId = groupCount++;

        Group storage g = _groups[groupId];
        g.name               = name;
        g.creator            = msg.sender;
        g.cUSD               = cUSD;
        g.contributionAmount = contributionAmount;
        g.cycleDurationSecs  = cycleDurationSecs;
        g.lastCycleAt        = block.timestamp;
        g.currentRound       = 0;
        g.status             = GroupStatus.Active;
        g.members            = members;

        emit GroupCreated(groupId, name, msg.sender, contributionAmount, cycleDurationSecs, members);
    }

    // ─── Agent cycle ──────────────────────────────────────────────────────────

    /**
     * @notice Execute one collection + payout cycle for a group.
     * @dev    Only callable by `agentAddress`.
     *         Collects from all non-removed members that have sufficient
     *         allowance.  If a member's allowance is insufficient their
     *         contribution is skipped and CollectionFailed is emitted —
     *         the cycle still proceeds (best-effort collection).
     *         The full amount actually collected is sent to the current
     *         round's recipient.
     */
    function runCycle(uint256 groupId) external onlyAgent {
        Group storage g = _groups[groupId];
        if (g.members.length == 0) revert GroupNotFound();
        if (g.status != GroupStatus.Active && g.status != GroupStatus.Collecting) {
            revert GroupNotActive();
        }

        uint256 nextAllowed = g.lastCycleAt + g.cycleDurationSecs;
        if (block.timestamp < nextAllowed) {
            revert TooEarlyToRunCycle(nextAllowed);
        }

        g.status = GroupStatus.Collecting;

        address recipient = g.members[g.currentRound];
        IERC20  token     = IERC20(g.cUSD);
        uint256 potAmount = 0;

        // Collect from all members
        for (uint256 i = 0; i < g.members.length; i++) {
            address member = g.members[i];
            if (isRemoved[groupId][member]) continue;
            if (member == recipient) {
                // Recipient still contributes to their own pot
            }

            uint256 allowance = token.allowance(member, address(this));
            if (allowance < g.contributionAmount) {
                emit CollectionFailed(groupId, member, "insufficient allowance");
                continue;
            }

            bool ok = token.transferFrom(member, address(this), g.contributionAmount);
            if (!ok) {
                emit CollectionFailed(groupId, member, "transferFrom failed");
                continue;
            }

            potAmount += g.contributionAmount;
        }

        // Send pot to recipient
        if (potAmount > 0) {
            bool sent = token.transfer(recipient, potAmount);
            if (!sent) revert TransferFailed();
        }

        uint8 totalMembers = uint8(g.members.length);
        emit CycleRun(groupId, g.currentRound, recipient, potAmount, block.timestamp);

        // Advance state
        g.lastCycleAt  = block.timestamp;
        g.currentRound = (g.currentRound + 1) % totalMembers;
        g.status       = GroupStatus.Active;

        // Detect completed full rotation
        if (g.currentRound == 0) {
            g.status = GroupStatus.Completed;
            emit GroupCompleted(groupId);
        }
    }

    /**
     * @notice Restart a completed group for another full rotation.
     *         Resets currentRound and status to Active.
     */
    function restartGroup(uint256 groupId) external {
        Group storage g = _groups[groupId];
        if (g.members.length == 0) revert GroupNotFound();
        if (g.status != GroupStatus.Completed) revert GroupNotActive();
        if (msg.sender != g.creator && msg.sender != owner) revert NotOwner();

        g.status       = GroupStatus.Active;
        g.currentRound = 0;
        g.lastCycleAt  = block.timestamp;

        emit GroupRestarted(groupId);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function pauseGroup(uint256 groupId) external onlyOwner {
        _groups[groupId].status = GroupStatus.Paused;
        emit GroupPaused(groupId);
    }

    function resumeGroup(uint256 groupId) external onlyOwner {
        _groups[groupId].status = GroupStatus.Active;
        emit GroupResumed(groupId);
    }

    function removeMember(uint256 groupId, address member) external onlyOwner {
        isRemoved[groupId][member] = true;
    }

    function setAgentAddress(address newAgent) external onlyOwner {
        agentAddress = newAgent;
        emit AgentAddressUpdated(newAgent);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getGroup(uint256 groupId) external view returns (
        string memory name,
        address creator,
        address cUSD,
        uint256 contributionAmount,
        uint256 cycleDurationSecs,
        uint256 lastCycleAt,
        uint8   currentRound,
        GroupStatus status,
        address[] memory members
    ) {
        Group storage g = _groups[groupId];
        return (
            g.name,
            g.creator,
            g.cUSD,
            g.contributionAmount,
            g.cycleDurationSecs,
            g.lastCycleAt,
            g.currentRound,
            g.status,
            g.members
        );
    }

    function getMembers(uint256 groupId) external view returns (address[] memory) {
        return _groups[groupId].members;
    }

    function nextCycleAt(uint256 groupId) external view returns (uint256) {
        Group storage g = _groups[groupId];
        return g.lastCycleAt + g.cycleDurationSecs;
    }

    function allGroups() external view returns (uint256 count) {
        return groupCount;
    }
}
