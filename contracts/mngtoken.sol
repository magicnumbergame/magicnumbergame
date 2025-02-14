// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Magic Number Game Token (MNG)
/// @notice A fixed-supply ERC-20 token used as rewards in the GuessTheNumber game
contract MNGToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 21_000_000 * 10**18; // 21M MNG with 18 decimals

    constructor(
        address gameContract, 
        address devFund
    ) ERC20("Magic Number Game Token", "MNG") Ownable(msg.sender) { // ✅ Pass deployer as owner
        require(gameContract != address(0), "Invalid game contract address");
        require(devFund != address(0), "Invalid dev fund address");

        // Mint total supply to this contract
        _mint(address(this), TOTAL_SUPPLY);

        // ✅ Send 20,000,000 MNG to the GuessTheNumber game contract
        _transfer(address(this), gameContract, 20_000_000 * 10**18);

        // ✅ Send 1,000,000 MNG to the dev fund
        _transfer(address(this), devFund, 1_000_000 * 10**18);
    }

    /// @notice Allows contract owner to withdraw mistakenly sent ERC-20 tokens (not MNG itself)
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(this), "Cannot withdraw MNG token");
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}

