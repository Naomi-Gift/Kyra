// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IChoreVault} from "../interfaces/IChoreVault.sol";

/**
 * @title  GroupManager
 * @notice Library encapsulating all savings-group state CRUD.
 *         Imported and used-as by ChoreVault.
 */
library GroupManager {
    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Minimum number of members in a valid group.
    uint256 public constant MIN_MEMBERS = 2;

    /// @notice Maximum number of members in a valid group.
    uint256 public constant MAX_MEMBERS = 50;

    /// @notice Minimum cycle interval (1 day in seconds).
    uint256 public constant MIN_INTERVAL = 1 days;

    /// @notice Maximum cycle interval (365 days in seconds).
    uint256 public constant MAX_INTERVAL = 365 days;

    // ─── Type alias ───────────────────────────────────────────────────────────

    /// @dev Re-export the Group struct from IChoreVault so callers only import one file.
    using GroupManager for mapping(uint256 => IChoreVault.Group);

    // ─── Validation ───────────────────────────────────────────────────────────

    /**
     * @notice Validate group-creation parameters.
     *         Reverts with the appropriate IChoreVault custom error on failure.
     * @param members      Proposed member list.
     * @param amount       Contribution amount per cycle.
     * @param intervalDays Cycle length in days.
     */
    function validateCreation(
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) internal pure {
        uint256 len = members.length;
        if (len < MIN_MEMBERS || len > MAX_MEMBERS) revert IChoreVault.InvalidGroupSize();
        if (amount == 0) revert IChoreVault.InvalidAmount();

        uint256 interval = intervalDays * 1 days;
        if (interval < MIN_INTERVAL || interval > MAX_INTERVAL) revert IChoreVault.InvalidInterval();

        // Check for zero addresses and duplicates
        for (uint256 i = 0; i < len; ) {
            if (members[i] == address(0)) revert IChoreVault.ZeroAddress();
            for (uint256 j = i + 1; j < len; ) {
                if (members[i] == members[j]) revert IChoreVault.InvalidGroupSize();
                unchecked { ++j; }
            }
            unchecked { ++i; }
        }
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    /**
     * @notice Write a new group into storage.
     * @param groups      The groups mapping.
     * @param groupId     The ID slot to write.
     * @param members     Validated member list (calldata).
     * @param amount      Contribution amount per cycle.
     * @param intervalDays Cycle length in days.
     */
    function create(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId,
        address[] calldata members,
        uint256 amount,
        uint256 intervalDays
    ) internal {
        IChoreVault.Group storage g = groups[groupId];
        uint256 interval = intervalDays * 1 days;

        // Push members one-by-one (required for Solidity storage arrays)
        for (uint256 i = 0; i < members.length; ) {
            g.members.push(members[i]);
            unchecked { ++i; }
        }

        g.amount          = amount;
        g.interval        = interval;
        g.nextCollection  = block.timestamp + interval;
        g.rotationIndex   = 0;
        g.active          = true;
    }

    /**
     * @notice Advance the collection timestamp by one interval.
     * @param groups  The groups mapping.
     * @param groupId The target group.
     */
    function advanceCollection(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId
    ) internal {
        groups[groupId].nextCollection = block.timestamp + groups[groupId].interval;
    }

    /**
     * @notice Advance the rotation index to the next member, wrapping around.
     * @param groups  The groups mapping.
     * @param groupId The target group.
     */
    function advanceRotation(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId
    ) internal {
        IChoreVault.Group storage g = groups[groupId];
        g.rotationIndex = (g.rotationIndex + 1) % g.members.length;
    }

    /**
     * @notice Remove a member from a group using swap-and-pop.
     *         Fixes rotationIndex if necessary.
     *         Disbands the group if fewer than MIN_MEMBERS remain.
     * @param groups  The groups mapping.
     * @param groupId The target group.
     * @param member  The address to remove.
     */
    function removeMember(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId,
        address member
    ) internal {
        IChoreVault.Group storage g = groups[groupId];
        uint256 len = g.members.length;

        uint256 idx = type(uint256).max;
        for (uint256 i = 0; i < len; ) {
            if (g.members[i] == member) { idx = i; break; }
            unchecked { ++i; }
        }
        // Member must exist (caller is responsible for pre-checking)
        require(idx != type(uint256).max, "GroupManager: not a member");

        // Swap-and-pop
        g.members[idx] = g.members[len - 1];
        g.members.pop();

        // Fix rotationIndex:
        // If rotationIndex pointed to the removed slot or the swapped-in element,
        // clamp to valid range.
        if (g.members.length == 0) {
            g.rotationIndex = 0;
        } else if (g.rotationIndex >= g.members.length) {
            g.rotationIndex = 0;
        }

        // Disband if too few members remain
        if (g.members.length < MIN_MEMBERS) {
            disband(groups, groupId);
        }
    }

    /**
     * @notice Mark a group as inactive (disbanded).
     * @param groups  The groups mapping.
     * @param groupId The target group.
     */
    function disband(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId
    ) internal {
        groups[groupId].active = false;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /**
     * @notice Returns true if `account` is a member of the group.
     */
    function isMember(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId,
        address account
    ) internal view returns (bool) {
        address[] storage members = groups[groupId].members;
        for (uint256 i = 0; i < members.length; ) {
            if (members[i] == account) return true;
            unchecked { ++i; }
        }
        return false;
    }

    /**
     * @notice Returns the address that will receive the next pot release.
     */
    function currentRecipient(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId
    ) internal view returns (address) {
        IChoreVault.Group storage g = groups[groupId];
        return g.members[g.rotationIndex];
    }

    /**
     * @notice Returns the maximum pot size (members × amount) for one cycle.
     */
    function expectedPotSize(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId
    ) internal view returns (uint256) {
        IChoreVault.Group storage g = groups[groupId];
        return g.members.length * g.amount;
    }

    /**
     * @notice Returns true if `block.timestamp` has reached `nextCollection`.
     */
    function isDueForCollection(
        mapping(uint256 => IChoreVault.Group) storage groups,
        uint256 groupId
    ) internal view returns (bool) {
        return block.timestamp >= groups[groupId].nextCollection;
    }
}
