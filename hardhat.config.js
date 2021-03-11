/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('@nomiclabs/hardhat-waffle');
require("dotenv").config();
require('@nomiclabs/hardhat-solhint');
require('solidity-coverage');

module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.7.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 20,
      blockGasLimit: 9000000000000,
      forking: {
        url: process.env.ALCHEMY_MAINNET_URL,
        blockNumber: 11997864,
      }
    }
  },
  mocha: {
    timeout: 2000000
  }
};
