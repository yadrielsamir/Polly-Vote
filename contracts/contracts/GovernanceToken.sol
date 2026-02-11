// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
        Ownable(msg.sender)
    {}

    // Demo/testing convenience
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
