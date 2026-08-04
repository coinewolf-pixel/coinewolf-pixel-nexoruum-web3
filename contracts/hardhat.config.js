require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/**
 * IMPORTANT: PRIVATE_KEY and *_RPC_URL come from a local .env file only.
 * .env is git-ignored — never commit real private keys. Use a dedicated
 * deployer wallet, ideally one funded only with testnet ETH (from a
 * faucet), never a wallet holding real funds.
 */
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
};
