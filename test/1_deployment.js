const { expect } = require('chai');

describe('Deploying the plexus contracts', () => {
  let wrapper, tokenRewards, plexusOracle, tier1Staking, core, tier2Farm, owner, addr1, addr2;

  beforeEach(async () => {
    // get the contract factories
    const Wrapper = await ethers.getContractFactory('WrapAndUnWrap');
    const TokenRewards = await ethers.getContractFactory('TokenRewards');
    const PlexusOracle = await ethers.getContractFactory('PlexusOracle');
    const Tier1Staking = await ethers.getContractFactory('Tier1FarmController');
    const Core = await ethers.getContractFactory('Core');
    const Tier2Farm = await ethers.getContractFactory('Tier2FarmController');
    
    // get the signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // then deploy the contracts and wait for them to be mined
    wrapper = await (await Wrapper.deploy()).deployed();
    tokenRewards = await (await TokenRewards.deploy()).deployed();
    plexusOracle = await (await PlexusOracle.deploy()).deployed();
    tier1Staking = await (await  Tier1Staking.deploy()).deployed();
    core = await (await Core.deploy()).deployed();
    tier2Farm = await (await Tier2Farm.deploy()).deployed();

    // then setup the contracts
    await tokenRewards.updateOracleAddress(plexusOracle.address);

    await plexusOracle.updateRewardAddress(tokenRewards.address);
    await plexusOracle.updateCoreAddress(core.address);

    await core.setOracleAddress(plexusOracle.address);
    await core.setStakingAddress(tier1Staking.address);
    await core.setConverterAddress(wrapper.address);

    await tier1Staking.updateOracleAddress(plexusOracle.address);
    await tier1Staking.addOrEditTier2ChildStakingContract("FARM", tier2Farm.address);
  });

  describe('Test plexus contract deployment', () => {

    it('Should set the deployed contracts to the correct owner', async function () {
      expect(await wrapper.owner()).to.equal(owner.address);
      expect(await tokenRewards.owner()).to.equal(owner.address);
      expect(await plexusOracle.owner()).to.equal(owner.address);
      expect(await tier1Staking.owner()).to.equal(owner.address);
      expect(await core.owner()).to.equal(owner.address);
      expect(await tier2Farm.owner()).to.equal(owner.address);
    });

    it('Should setup the contracts addresses correctly after deployment', async function () {
      expect(await tokenRewards.oracleAddress()).to.equal(plexusOracle.address);
      
      expect(await plexusOracle.rewardAddress()).to.equal(tokenRewards.address);
      expect(await plexusOracle.coreAddress()).to.equal(core.address);

      expect(await core.oracleAddress()).to.equal(plexusOracle.address);
      expect(await core.converterAddress()).to.equal(wrapper.address);
      expect(await core.stakingAddress()).to.equal(tier1Staking.address);

      expect(await tier1Staking.oracleAddress()).to.equal(plexusOracle.address);
      expect(await tier1Staking.tier2StakingContracts("FARM")).to.equal(tier2Farm.address);
    });

   
  });

});