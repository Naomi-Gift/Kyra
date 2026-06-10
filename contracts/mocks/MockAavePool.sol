// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAavePool} from "../src/interfaces/IAavePool.sol";
import {MockERC20} from "./MockERC20.sol";

/**
 * @title  MockAavePool
 * @notice Simulates Aave v3 for tests.
 *
 *  supply()   — pulls tokens from msg.sender, records deposit under `onBehalfOf`.
 *  withdraw() — returns the recorded principal + YIELD_BONUS to `to`.
 *               The YIELD_BONUS is minted/pre-funded in setUp so the pool
 *               always has enough tokens.
 */
contract MockAavePool is IAavePool {
    MockERC20 public immutable token;

    /// @notice Fixed simulated yield added on top of principal each withdraw.
    uint256 public constant YIELD_BONUS = 1e18;

    /// @dev deposited[onBehalfOf] → amount deposited via supply()
    mapping(address => uint256) public deposited;

    constructor(address _token) {
        token = MockERC20(_token);
    }

    /// @inheritdoc IAavePool
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16  /*referralCode*/
    ) external override {
        require(asset == address(token), "MockAavePool: wrong asset");
        deposited[onBehalfOf] += amount;
        bool ok = MockERC20(asset).transferFrom(msg.sender, address(this), amount);
        require(ok, "MockAavePool: transferFrom failed");
    }

    /// @inheritdoc IAavePool
    /// @dev `amount` is ignored — always returns full deposit + YIELD_BONUS.
    function withdraw(
        address asset,
        uint256 /*amount*/,
        address to
    ) external override returns (uint256 returned) {
        require(asset == address(token), "MockAavePool: wrong asset");
        // The vault supplies on behalf of itself, so look up deposited[to]
        // (ChoreVault passes `address(this)` as onBehalfOf in supply, and
        //  `address(this)` as `to` in withdraw — both refer to the vault).
        uint256 principal = deposited[to];
        deposited[to] = 0;
        returned = principal + YIELD_BONUS;
        bool ok = MockERC20(asset).transfer(to, returned);
        require(ok, "MockAavePool: transfer failed");
    }
}
