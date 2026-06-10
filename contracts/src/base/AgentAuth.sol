// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IChoreVault} from "../interfaces/IChoreVault.sol";

/**
 * @title  AgentAuth
 * @notice Abstract base that stores the agent address and exposes the
 *         `onlyAgent` modifier.  Inheriting contracts must pass the initial
 *         agent address to the constructor.
 *
 *  The agent is the off-chain automation wallet authorised to call
 *  `collect()` and `release()`.  It can rotate its own key via
 *  `updateAgent()`.
 */
abstract contract AgentAuth {
    // ─── Storage ──────────────────────────────────────────────────────────────

    /// @notice The currently registered agent address.
    address public agent;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted whenever the agent address is updated.
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _agent  The initial agent address.  Must not be the zero address.
     */
    constructor(address _agent) {
        if (_agent == address(0)) revert IChoreVault.ZeroAddress();
        agent = _agent;
    }

    // ─── Modifier ─────────────────────────────────────────────────────────────

    /// @dev Reverts with `OnlyAgent` if the caller is not the registered agent.
    modifier onlyAgent() {
        if (msg.sender != agent) revert IChoreVault.OnlyAgent();
        _;
    }

    // ─── Functions ────────────────────────────────────────────────────────────

    /**
     * @notice Rotate the agent address.  Only the current agent may call this,
     *         preventing a compromised owner from locking out the agent.
     * @param newAgent  The replacement agent address.  Must not be zero.
     */
    function updateAgent(address newAgent) external onlyAgent {
        if (newAgent == address(0)) revert IChoreVault.ZeroAddress();
        address old = agent;
        agent = newAgent;
        emit AgentUpdated(old, newAgent);
    }
}
