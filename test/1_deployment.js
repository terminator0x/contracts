const { expect } = require('chai');

describe('Deploying the plexus contracts', () => {
  let wrapper, tokenRewards, plexusOracle, tier1FarmController, core, tier2FarmController, owner, addr1, addr2;

  beforeEach(async () => {

    // get the contract factories
    const Wrapper = await ethers.getContractFactory('WrapAndUnWrap');
    const TokenRewards = await ethers.getContractFactory('TokenRewards');
    const PlexusOracle = await ethers.getContractFactory('PlexusOracle');
    const Tier1FarmController = await ethers.getContractFactory('Tier1FarmController');
    const Core = await ethers.getContractFactory('Core');
    const Tier2FarmController = await ethers.getContractFactory('Tier2FarmController');
    
    // get the signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // then deploy the contracts and wait for them to be mined
    wrapper = await (await Wrapper.deploy()).deployed();
    tokenRewards = await (await TokenRewards.deploy()).deployed();
    plexusOracle = await (await PlexusOracle.deploy()).deployed();
    tier1FarmController = await (await  Tier1FarmController.deploy()).deployed();
    core = await (await Core.deploy()).deployed();
    tier2FarmController = await (await Tier2FarmController.deploy()).deployed();

    // then setup the contracts
    await tokenRewards.updateOracleAddress(plexusOracle.address);
    await plexusOracle.updateRewardAddress(tokenRewards.address);
    await plexusOracle.updateCoreAddress(core.address);
    await tier1FarmController.updateOracleAddress(plexusOracle.address);
    await core.setOracleAddress(plexusOracle.address);
    await core.setStakingAddress(tier1FarmController.address);
    await core.setConverterAddress(wrapper.address);
  });

  describe('Test contract deployment', () => {

    it('Should set the deployed contracts to the correct owner', async function () {
      expect(await wrapper.owner()).to.equal(owner.address);
      expect(await tokenRewards.owner()).to.equal(owner.address);
      expect(await plexusOracle.owner()).to.equal(owner.address);
      expect(await tier1FarmController.owner()).to.equal(owner.address);
      expect(await core.owner()).to.equal(owner.address);
      expect(await tier2FarmController.owner()).to.equal(owner.address);
    });

    it('Should setup the contracts addresses correctly after deployment', async function () {
        expect(await tokenRewards.oracleAddress()).to.equal(plexusOracle.address);
        expect(await plexusOracle.rewardAddress()).to.equal(tokenRewards.address);
        expect(await plexusOracle.coreAddress()).to.equal(core.address);
        expect(await tier1FarmController.oracleAddress()).to.equal(plexusOracle.address);
        expect(await core.oracleAddress()).to.equal(plexusOracle.address);
        expect(await core.converterAddress()).to.equal(wrapper.address);
        expect(await core.stakingAddress()).to.equal(tier1FarmController.address);
    });

   
  });

});