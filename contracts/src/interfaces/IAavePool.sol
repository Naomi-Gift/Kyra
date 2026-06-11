// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  IAavePool
 * @notice Minimal Aave v3 pool interface — only the two functions KyraVault needs.
 *         Full interface: https://github.com/aave/aave-v3-core
 */
interface IAavePool {
    /**
     * @notice Supplies `amount` of `asset` into the Aave lending pool on behalf
     *         of `onBehalfOf`, minting the corresponding aTokens.
     * @param asset          The address of the underlying ERC-20 asset.
     * @param amount         The amount to supply (18-decimal wei).
     * @param onBehalfOf     The address that will receive the aTokens.
     * @param referralCode   Referral code for the Aave ecosystem (use 0).
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16  referralCode
    ) external;

    /**
     * @notice Withdraws `amount` of `asset` from the Aave lending pool,
     *         burning the corresponding aTokens held by the caller.
     * @param asset   The address of the underlying ERC-20 asset.
     * @param amount  The amount to withdraw. Pass `type(uint256).max` to
     *                withdraw the full aToken balance.
     * @param to      The address that will receive the underlying asset.
     * @return        The actual amount withdrawn (may differ from `amount` if
     *                `type(uint256).max` was passed).
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}
