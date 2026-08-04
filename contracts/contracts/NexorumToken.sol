// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NexorumToken (NEX)
 * @notice A real, standard ERC20 token replacing the previous fake
 * in-memory "NEX" balance data. Fixed supply, minted entirely to the
 * deployer at construction — no further minting is possible (mint()
 * is intentionally not exposed), so the total supply can never be
 * inflated after deployment.
 */
contract NexorumToken is ERC20, Ownable {
    /// @param initialSupply Total supply to mint, in whole tokens (not wei).
    ///        The constructor multiplies by 10**decimals() for you.
    constructor(uint256 initialSupply) ERC20("NEXORUM", "NEX") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
