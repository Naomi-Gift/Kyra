// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAavePool} from "../src/interfaces/IAavePool.sol";
import {MockERC20} from "./MockERC20.sol";

/**
 * @title  MockAavePool
 * @notice Simulates Aave v3 for tests.
 *
 *  supply()   — pulls `amount` from msg.sender, records under `onBehalfOf`.
 *  withdraw() — returns exactly `amount` requested + YIELD_BONUS to `to`.
 *               setUp() must pre-fund this contract with enough tokens
 *               to cover the yield payments.
 */
contract MockAavePool is IAavePool {
    MockERC20 public immutable token;

    uint256 public constant YIELD_BONUS = 1e18;

    // deposited[onBehalfOf] = total deposited via supply()
    mapping(address => uint256) public deposited;

    constructor(address _token) {
        token = MockERC20(_token);
    }

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16  /*referralCode*/
    ) external override {
        require(asset == address(token), "wrong asset");
        deposited[onBehalfOf] += amount;
        require(
            MockERC20(asset).transferFrom(msg.sender, address(this), amount),
            "supply: transferFrom failed"
        );
    }

    /**
     * @dev Returns the requested `amount` plus YIELD_BONUS.
     *      `amount` should match what was deposited (ChoreVault passes
     *      `pendingRelease`, not `type(uint256).max`).
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256 returned) {
        require(asset == address(token), "wrong asset");
        deposited[to] = deposited[to] > amount ? deposited[to] - amount : 0;
        returned = amount + YIELD_BONUS;
        require(
            MockERC20(asset).transfer(to, returned),
            "withdraw: transfer failed"
        );
    }
}
