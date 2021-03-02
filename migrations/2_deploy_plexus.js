const Wrapper = artifacts.require("WrapAndUnWrap");
const TokenRewards = artifacts.require("TokenRewards");
const Oracle = artifacts.require("Oracle");
const Tier1Staking = artifacts.require("Tier1FarmController");
const Core = artifacts.require("Core");
const Tier2Farm = artifacts.require("Tier2FarmController");


module.exports = async (deployer) => {

    // Deploy all the contracts
    const wrapper = await deployer.deploy(Wrapper);
    const tokenRewards = await deployer.deploy(TokenRewards);
    console.log("rewards done");
    const oracle = await deployer.deploy(Oracle);
    const tier1Staking = await deployer.deploy(Tier1Staking);
    const core = await deployer.deploy(Core);
    await deployer.deploy(Tier2Farm);

    console.log("DEPLOYMENT DONE!!");
    console.log("==================");
    console.log("SETTING UP TXNS");
   

    // Run the setup txns
    const wrapperInstance = await wrapper.deployed();
    const tokenRewardsInstance = await tokenRewards.deployed();
    const oracleInstance = await oracle.deployed();
    const tier1StakingInstance = await tier1Staking.deployed();
    const coreInstance = await core.deployed();

    // Setup the needed txns
    await tokenRewardsInstance.updateOracleAddress(oracleInstance.address);

    await oracleInstance.updateRewardAddress(tokenRewardsInstance.address);
    await oracleInstance.updateCoreAddress(coreInstance.address);

    await tier1StakingInstance.updateOracleAddress(oracleInstance.address);

    await coreInstance.setOracleAddress(oracleInstance.address);
    await coreInstance.setStakingAddress(tier1StakingInstance.address);
    await coreInstance.setConverterAddress(wrapperInstance.address);
}; 