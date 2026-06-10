// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IChoreVault}   from "./interfaces/IChoreVault.sol";
import {IAavePool}     from "./interfaces/IAavePool.sol";
import {AgentAuth}     from "./base/AgentAuth.sol";
import {GroupManager}  from "./libraries/GroupManager.sol";
import {TrustRegistry} from "./libraries/TrustRegistry.sol";
import {ExitVoting}    from "./libraries/ExitVoting.sol";

// ─── Inline ReentrancyGuard (no OpenZeppelin dependency) ──────────────────────
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED     = 2;
    uint256 private _status;
    constructor() { _status = _NOT_ENTERED; }
    modifier nonReentrant() {
        require(_status != _ENTERED, "reentrant");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

// ─── Minimal IERC20 ───────────────────────────────────────────────────────────
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title  ChoreVault
 * @notice Trustless rotating savings circles (ajo / susu / chama) on Celo.
 *         Idle funds earn yield via Aave v3 between collection and release.
 *
 * Architecture: thin orchestrator — all business logic lives in the three
 * library modules (GroupManager, TrustRegistry, ExitVoting).
 */
contract ChoreVault is AgentAuth, ReentrancyGuard, IChoreVault {

    // ─── Library bindings ─────────────────────────────────────────────────────
    using GroupManager  for mapping(uint256 => IChoreVault.Group);
    using TrustRegistry for mapping(address => uint256);
    using ExitVoting    for mapping(uint256 => mapping(address => ExitVoting.Ballot));

    // ─── Storage ──────────────────────────────────────────────────────────────
    mapping(uint256 => IChoreVault.Group)                        private _groups;
    mapping(address => uint256)                                  private _trustScores;
    mapping(uint256 => mapping(address => ExitVoting.Ballot))    private _exitBallots;
    uint256 private _groupCount;

    IERC20    public immutable cUSD;
    IAavePool public immutable aavePool;

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address _agent, address _cUSD, address _aavePool)
        AgentAuth(_agent)
    {
        if (_cUSD     == address(0)) revert ZeroAddress();
        if (_aavePool == address(0)) revert ZeroAddress();
        cUSD     = IERC20(_cUSD);
        aavePool = IAavePool(_aavePool);
    }

    // ─── createGroup ──────────────────────────────────────────────────────────
    /// @inheritdoc IChoreVault
    function createGroup(
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) external returns (uint256 groupId) {
        GroupManager.validateCreation(members, amount, intervalDays);

        groupId = _groupCount;
        _groups.create(groupId, members, amount, intervalDays);

        for (uint256 i = 0; i < members.length; ) {
            _trustScores.initialise(members[i]);
            unchecked { ++i; }
        }

        emit GroupCreated(groupId, msg.sender, members, amount, intervalDays * 1 days);
        _groupCount++;
    }

    // ─── collect ──────────────────────────────────────────────────────────────
    /// @inheritdoc IChoreVault
    function collect(uint256 groupId) external onlyAgent nonReentrant {
        if (groupId >= _groupCount)                revert GroupNotFound();
        if (!_groups[groupId].active)              revert GroupInactive();
        if (!_groups.isDueForCollection(groupId))  revert TooEarlyToCollect();

        address[] storage members = _groups[groupId].members;
        uint256           amount  = _groups[groupId].amount;
        uint256           total;

        for (uint256 i = 0; i < members.length; ) {
            address m = members[i];

            // Low-level call: one member failure must not revert the whole tx
            (bool ok, bytes memory ret) = address(cUSD).call(
                abi.encodeWithSelector(IERC20.transferFrom.selector, m, address(this), amount)
            );
            bool success = ok && (ret.length == 0 || abi.decode(ret, (bool)));

            if (success) {
                (uint256 old, uint256 nw) = _trustScores.reward(m);
                emit TrustScoreUpdated(m, old, nw);
                emit Collected(groupId, m, amount);
                total += amount;
            } else {
                (uint256 old, uint256 nw) = _trustScores.penalise(m);
                emit TrustScoreUpdated(m, old, nw);
                emit CollectionFailed(groupId, m, "transferFrom failed");
            }
            unchecked { ++i; }
        }

        if (total > 0) _depositToAave(total);
        _groups.advanceCollection(groupId);
    }

    // ─── release ──────────────────────────────────────────────────────────────
    /// @inheritdoc IChoreVault
    function release(uint256 groupId) external onlyAgent nonReentrant {
        if (groupId >= _groupCount)   revert GroupNotFound();
        if (!_groups[groupId].active) revert GroupInactive();

        uint256 principal = _groups.expectedPotSize(groupId);
        uint256 total     = _withdrawFromAave();
        uint256 yld       = total > principal ? total - principal : 0;
        address recipient = _groups.currentRecipient(groupId);

        bool sent = cUSD.transfer(recipient, total);
        require(sent, "ChoreVault: transfer failed");
        emit PotReleased(groupId, recipient, principal, yld, total);

        _groups.advanceRotation(groupId);
    }

    // ─── requestExit ──────────────────────────────────────────────────────────
    /// @inheritdoc IChoreVault
    function requestExit(uint256 groupId) external {
        if (!_groups.isMember(groupId, msg.sender)) revert NotAMember();
        _exitBallots.open(groupId, msg.sender, _groups[groupId].members.length);
        emit ExitRequested(groupId, msg.sender);
    }

    // ─── voteExit ─────────────────────────────────────────────────────────────
    /// @inheritdoc IChoreVault
    function voteExit(uint256 groupId, address member, bool approve) external {
        if (!_groups.isMember(groupId, msg.sender))             revert NotAMember();
        if (!_exitBallots.isActive(groupId, member))            revert NoExitRequestActive();
        if (_exitBallots.hasVoted(groupId, member, msg.sender)) revert AlreadyVoted();

        (bool resolved, bool passed) = _exitBallots.vote(
            groupId, member, msg.sender, approve
        );
        emit ExitVoteCast(groupId, member, msg.sender, approve);

        if (resolved) {
            if (passed) {
                _groups.removeMember(groupId, member);
                emit ExitApproved(groupId, member);
                if (!_groups[groupId].active) emit GroupDisbanded(groupId);
            } else {
                emit ExitRejected(groupId, member);
            }
        }
    }

    // ─── Views ────────────────────────────────────────────────────────────────
    /// @inheritdoc IChoreVault
    function getTrustScore(address member) external view returns (uint256) {
        return TrustRegistry.get(_trustScores, member);
    }

    /// @inheritdoc IChoreVault
    function getGroup(uint256 groupId)
        external view
        returns (
            address[] memory members,
            uint256 amount,
            uint256 interval,
            uint256 nextCollection,
            uint256 rotationIndex,
            bool    active
        )
    {
        IChoreVault.Group storage g = _groups[groupId];
        return (g.members, g.amount, g.interval, g.nextCollection, g.rotationIndex, g.active);
    }

    /// @inheritdoc IChoreVault
    function groupCount() external view returns (uint256) { return _groupCount; }

    /// @inheritdoc IChoreVault
    function isMember(uint256 groupId, address account) external view returns (bool) {
        return _groups.isMember(groupId, account);
    }

    // ─── Private ──────────────────────────────────────────────────────────────
    function _depositToAave(uint256 amount) private {
        cUSD.approve(address(aavePool), amount);
        aavePool.supply(address(cUSD), amount, address(this), 0);
    }

    function _withdrawFromAave() private returns (uint256) {
        return aavePool.withdraw(address(cUSD), type(uint256).max, address(this));
    }
}
