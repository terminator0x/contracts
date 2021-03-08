# Plexus Smart Contracts Tests

The testing for the plexus contracts is done using [Hardhat via a mainnet fork](https://hardhat.org/guides/mainnet-forking.html).

## Configuration

Before you run the tests, you need to configure the project by doing the following,

1. Create a new [Alchemy Account](https://alchemyapi.io) if you already don't have one.
2. Rename the `.env_sample` file to `.env` and set the `ALCHEMY_MAINNET_URL` variable to the mainnet url in your alchemy account above.

## Run The Tests

To run the tests, make sure you install the latest version of [node.js](https://nodejs.org/en/ and [yarn](https://yarnpkg.com/getting-started/install)

Then install the required node dependencies i.e. `yarn install` and then finally run the tests via the command `npx hardhat test`

### Test Setup

The plexus contracts should be deployed in the following order,

1. `wrapper.sol`
2. `tokenrewards.sol` 
3. `oracle.sol` 
4. `tier1Staking.sol` 
5. `core.sol` 
6. Finally after all the above contracts have been deployed, you can deploy the specific farming `tier2....` contractss i.e. `tier2Aave.sol`, `tier2Farm.sol` e.t.c
    - For example the `tier2Farm.sol` contract could be deployed, so that users can send tokens to the contract for Harvest.Finance farming e.t.c

### Transactions

After deploying the contracts, run these transactions to setup the plexus eco-system

1. Call the function `updateOracleAddress` in `tokenrewards.sol` and with the address of the `oracle.sol` contract.
2. Call the function `updateRewardAddress` in `oracle.sol` and with the address of the `tokenrewards.sol` contract.
3. Call the function `updateCoreAddress` in `oracle.sol` and with the address of the `core.sol` contract.
4. Call the function `updateOracleAddress` in `tier1Staking.sol` and with the address of the `oracle.sol` contract.
5. Call the function `setOracleAddress` in `core.sol` and then set it to the address of the `oracle.sol` contract.
6. Call the function `setStakingAddress` in `core.sol` and then set it to the address of the `tier1Staking.sol` contract.
7. Finally call the function `setConverterAddress` in `core.sol` and then set it to the address of the `wrapper.sol` contract.
