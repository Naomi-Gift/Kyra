// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAavePool} from "../src/interfaces/IAavePool.sol";
import {MockERC20} from "./MockERC20.sol";

/**
 * @title  MockAavePool
 * @notice Simulates Aave v3 for tests.
 *
 *  supply()   — pulls `amount` from msg.sender, records under `onBehalfOf`.
 *  withdraw() — if amount == type(uint256).max, returns full deposited balance
 *               + YIELD_BONUS. Otherwise returns the exact amount requested.
 *               setUp() must pre-fund this contract with YIELD_BONUS tokens.
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
        uint16 /*referralCode*/
    ) external override {
        require(asset == address(token), "wrong asset");
        deposited[onBehalfOf] += amount;
        require(
            MockERC20(asset).transferFrom(msg.sender, address(this), amount),
            "supply: transferFrom failed"
        );
    }

    /**
     * @dev Matches real Aave behaviour:
     *      - amount == type(uint256).max → withdraw full balance + yield
     *      - otherwise                  → withdraw exact amount (no yield)
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256 returned) {
        require(asset == address(token), "wrong asset");

        if (amount == type(uint256).max) {
            // Full withdrawal: principal + simulated yield
            uint256 principal = deposited[to];
            deposited[to] = 0;
            returned = principal + YIELD_BONUS;
        } else {
            // Exact withdrawal (no yield bonus for partial)
            require(deposited[to] >= amount, "insufficient deposited");
            deposited[to] -= amount;
            returned = amount;
        }

        require(
            MockERC20(asset).transfer(to, returned),
            "withdraw: transfer failed"
        );
    }
}
