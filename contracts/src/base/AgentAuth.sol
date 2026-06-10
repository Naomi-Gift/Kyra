// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IChoreVault} from "../interfaces/IChoreVault.sol";

/**
 * @title  AgentAuth
 * @notice Abstract base that stores the agent and owner addresses and exposes:
 *           - `onlyAgent` / `onlyOwner` modifiers
 *           - `rotateAgent`          — the agent rotates its own key
 *           - `emergencyRotateAgent` — the owner can rotate the agent
 *                                      (recovery if agent key is lost)
 *           - `transferOwnership`    — the owner hands off ownership
 *
 * @dev   `AgentRotated` is declared here rather than in IChoreVault because
 *         Solidity does not allow emitting events via an interface type prefix
 *         (`emit IChoreVault.AgentRotated(...)` is invalid).  ChoreVault
 *         inherits AgentAuth and therefore inherits this event.
 */
abstract contract AgentAuth {

    /// @notice The off-chain automation wallet.
    address public agent;

    /// @notice The privileged owner / emergency recovery address.
    address public owner;

    /// @notice Emitted whenever the agent address changes.
    event AgentRotated(address indexed oldAgent, address indexed newAgent);

    constructor(address _agent, address _owner) {
        if (_agent == address(0)) revert IChoreVault.ZeroAddress();
        if (_owner == address(0)) revert IChoreVault.ZeroAddress();
        agent = _agent;
        owner = _owner;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert IChoreVault.OnlyAgent();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert IChoreVault.OnlyOwner();
        _;
    }

    /// @notice The agent rotates its own key.
    function rotateAgent(address newAgent) external onlyAgent {
        if (newAgent == address(0)) revert IChoreVault.ZeroAddress();
        emit AgentRotated(agent, newAgent);
        agent = newAgent;
    }

    /// @notice The owner can rotate the agent key even if the agent key is lost.
    function emergencyRotateAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert IChoreVault.ZeroAddress();
        emit AgentRotated(agent, newAgent);
        agent = newAgent;
    }

    /// @notice Transfer ownership to a new address.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IChoreVault.ZeroAddress();
        owner = newOwner;
    }
}
