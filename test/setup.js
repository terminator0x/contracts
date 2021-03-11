const setupContracts = async() => {
    // get the contract factories
    const Wrapper = await ethers.getContractFactory('WrapAndUnWrap');
    const TokenRewards = await ethers.getContractFactory('TokenRewards');
    const PlexusOracle = await ethers.getContractFactory('PlexusOracle');
    const Tier1Staking = await ethers.getContractFactory('Tier1FarmController');
    const Core = await ethers.getContractFactory('Core');
    const Tier2Farm = await ethers.getContractFactory('Tier2FarmController');
    
    // get the signers
    let owner, addr1;
    [owner, addr1, ...addrs] = await ethers.getSigners();

    // then deploy the contracts and wait for them to be mined
    const wrapper = await (await Wrapper.deploy()).deployed();
    const tokenRewards = await (await TokenRewards.deploy()).deployed();
    const plexusOracle = await (await PlexusOracle.deploy()).deployed();
    const tier1Staking = await (await  Tier1Staking.deploy()).deployed();
    const core = await (await Core.deploy()).deployed();
    const tier2Farm = await (await Tier2Farm.deploy()).deployed();

    // then setup the contracts
    await tokenRewards.updateOracleAddress(plexusOracle.address);

    await plexusOracle.updateRewardAddress(tokenRewards.address);
    await plexusOracle.updateCoreAddress(core.address);

    await core.setOracleAddress(plexusOracle.address);
    await core.setStakingAddress(tier1Staking.address);
    await core.setConverterAddress(wrapper.address);

    await tier1Staking.updateOracleAddress(plexusOracle.address);
    await tier1Staking.addOrEditTier2ChildStakingContract("FARM", tier2Farm.address);

    return [wrapper, tokenRewards, plexusOracle, tier1Staking, core, tier2Farm, owner, addr1];
};

module.exports = { setupContracts }
