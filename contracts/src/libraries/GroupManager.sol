// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IKyraVault} from "../interfaces/IKyraVault.sol";

/**
 * @title  GroupManager
 * @notice Library encapsulating all savings-group state CRUD.
 *         Every function operates on a `mapping(uint256 => IKyraVault.Group)`.
 */
library GroupManager {

    uint256 public constant MIN_MEMBERS  = 2;
    uint256 public constant MAX_MEMBERS  = 50;
    uint256 public constant MIN_INTERVAL = 1 days;
    uint256 public constant MAX_INTERVAL = 365 days;

    // ─── Validation ───────────────────────────────────────────────────────────

    /**
     * @notice Validate group-creation parameters.
     *         O(n²) duplicate check is acceptable for the 50-member cap.
     */
    function validateCreation(
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) internal pure {
        uint256 len = members.length;
        if (len < MIN_MEMBERS || len > MAX_MEMBERS) revert IKyraVault.InvalidGroupSize();
        if (amount == 0)                             revert IKyraVault.InvalidAmount();

        uint256 interval = intervalDays * 1 days;
        if (interval < MIN_INTERVAL || interval > MAX_INTERVAL)
            revert IKyraVault.InvalidInterval();

        for (uint256 i = 0; i < len; ) {
            if (members[i] == address(0)) revert IKyraVault.ZeroAddress();
            for (uint256 j = i + 1; j < len; ) {
                if (members[i] == members[j]) revert IKyraVault.InvalidGroupSize();
                unchecked { ++j; }
            }
            unchecked { ++i; }
        }
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    /// @notice Write a new group into storage.
    function create(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId,
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) internal {
        IKyraVault.Group storage g = groups[groupId];
        uint256 interval = intervalDays * 1 days;

        for (uint256 i = 0; i < members.length; ) {
            g.members.push(members[i]);
            unchecked { ++i; }
        }
        g.amount         = amount;
        g.interval       = interval;
        g.nextCollection = block.timestamp + interval;
        g.rotationIndex  = 0;
        g.active         = true;
        g.pendingRelease = 0;
    }

    /// @notice Advance `nextCollection` by one interval.
    function advanceCollection(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId
    ) internal {
        groups[groupId].nextCollection = block.timestamp + groups[groupId].interval;
    }

    /// @notice Advance `rotationIndex` to the next member, wrapping around.
    function advanceRotation(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId
    ) internal {
        IKyraVault.Group storage g = groups[groupId];
        g.rotationIndex = (g.rotationIndex + 1) % g.members.length;
    }

    /**
     * @notice Remove a member via swap-and-pop.
     *         Fixes `rotationIndex` if it points past the end of the new array.
     *         Disbands the group if fewer than MIN_MEMBERS remain.
     */
    function removeMember(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId,
        address member
    ) internal {
        IKyraVault.Group storage g = groups[groupId];
        uint256 len = g.members.length;

        uint256 idx = type(uint256).max;
        for (uint256 i = 0; i < len; ) {
            if (g.members[i] == member) { idx = i; break; }
            unchecked { ++i; }
        }
        require(idx != type(uint256).max, "GroupManager: not a member");

        g.members[idx] = g.members[len - 1];
        g.members.pop();

        if (g.members.length == 0) {
            g.rotationIndex = 0;
        } else if (g.rotationIndex >= g.members.length) {
            g.rotationIndex = 0;
        }

        if (g.members.length < MIN_MEMBERS) {
            disband(groups, groupId);
        }
    }

    /// @notice Mark a group as inactive.
    function disband(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId
    ) internal {
        groups[groupId].active = false;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function isMember(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId,
        address account
    ) internal view returns (bool) {
        address[] storage m = groups[groupId].members;
        for (uint256 i = 0; i < m.length; ) {
            if (m[i] == account) return true;
            unchecked { ++i; }
        }
        return false;
    }

    function currentRecipient(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId
    ) internal view returns (address) {
        IKyraVault.Group storage g = groups[groupId];
        return g.members[g.rotationIndex];
    }

    function expectedPotSize(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId
    ) internal view returns (uint256) {
        IKyraVault.Group storage g = groups[groupId];
        return g.members.length * g.amount;
    }

    function isDueForCollection(
        mapping(uint256 => IKyraVault.Group) storage groups,
        uint256 groupId
    ) internal view returns (bool) {
        return block.timestamp >= groups[groupId].nextCollection;
    }
}
