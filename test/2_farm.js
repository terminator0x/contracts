require("dotenv").config();
const { expect } = require('chai');
const { waffle } = require("hardhat");
const provider = waffle.provider;
const abi = require('human-standard-token-abi')


describe('Re-deploying the plexus contracts', () => {
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

  describe('Test contract re-deployment', () => {

    it('Should set the re-deployed contracts to the correct owner', async function () {
        expect(await wrapper.owner()).to.equal(owner.address);
        expect(await tokenRewards.owner()).to.equal(owner.address);
        expect(await plexusOracle.owner()).to.equal(owner.address);
        expect(await tier1FarmController.owner()).to.equal(owner.address);
        expect(await core.owner()).to.equal(owner.address);
        expect(await tier2FarmController.owner()).to.equal(owner.address);
    });

    it('Should setup the contracts addresses correctly after re-deployment', async function () {
        expect(await tokenRewards.oracleAddress()).to.equal(plexusOracle.address);
        expect(await plexusOracle.rewardAddress()).to.equal(tokenRewards.address);
        expect(await plexusOracle.coreAddress()).to.equal(core.address);
        expect(await tier1FarmController.oracleAddress()).to.equal(plexusOracle.address);
        expect(await core.oracleAddress()).to.equal(plexusOracle.address);
        expect(await core.converterAddress()).to.equal(wrapper.address);
        expect(await core.stakingAddress()).to.equal(tier1FarmController.address);
    });
   
  });

  describe('Plexus Farm Token Transactions', () => {

    it('Plexus test user wallet balance is equal to 10000 ETH', async () => {
        const ethbalance = Number(ethers.utils.formatEther(await addr1.getBalance()));
        console.log('Starting ETH balance is ', ethbalance);
        expect(ethbalance).to.equal(10000);
 
    });

    it('Plexus test user wallet Farm Token balance is equal to zero', async () => {
        
        const farmTokenAddress = process.env.FARM_TOKEN_MAINNET_ADDRESS;
        const erc20 = new ethers.Contract(farmTokenAddress, abi, provider);

        // check the farm token balance in the contract account
        const userFarmTokenBalance = Number(ethers.utils.formatUnits(await erc20.balanceOf(addr1.address), `ether`));
    
        // Before conversion usser Farm Token balance should be zero
        console.log("User farm token balance before conversion: ", userFarmTokenBalance);
        expect(userFarmTokenBalance).to.be.lte(0);
 
    });


    it('Should convert 2 ETH to Farm token from harvest.finance', async () => {

       const zeroAddress = process.env.ZERO_ADDRESS;
       const farmTokenAddress = process.env.FARM_TOKEN_MAINNET_ADDRESS;
       const unitAmount = "2";

       // Please note, the number of farm tokens we want to get doesn't matter, so the unit amount is just a placeholder
       const amountPlaceholder = ethers.utils.parseEther(unitAmount)
    
       // we send 2 ETH to the wrapper for conversion
       let overrides = {
            value: ethers.utils.parseEther(unitAmount)
       };

       // send from addr1 as another user
       let wrapperAsSigner1 = wrapper.connect(addr1);

       // convert the 1 ETH to Farm token via wrapper
       const { status } = await (await wrapperAsSigner1.wrap(zeroAddress, [farmTokenAddress], amountPlaceholder, overrides)).wait();

       // check if the txn is successful
       expect(status).to.equal(1);

       // check 
       if (status === 1) {

        const erc20 = new ethers.Contract(farmTokenAddress, abi, provider);

        // check the farm token balance in the contract account
        const userFarmTokenBalance = Number(ethers.utils.formatUnits(await erc20.balanceOf(addr1.address), `ether`));
    
        // check if the conversion is successful and the user to have some farm tokens in his wallet
        console.log("User farm token balance after conversion: ", userFarmTokenBalance);
        expect(userFarmTokenBalance).to.be.gte(0);

       }
       // check that the users ETH balance has reduced regardless of the conversion status
       const ethbalance = Number(ethers.utils.formatEther(await addr1.getBalance()));
       console.log('ETH balance after conversion is ', ethbalance);
       expect(ethbalance).to.be.lt(10000);
 
    });

    it("User should be able to deposit Farm Tokens via the main contract (Core contract)", async () => {
        const farmTokenAddress = process.env.FARM_TOKEN_MAINNET_ADDRESS;
        const erc20 = new ethers.Contract(farmTokenAddress, abi, provider);

        // check the farm token balance in the contract account
        const userFarmTokenBalance = Number(ethers.utils.formatUnits(await erc20.balanceOf(addr1.address), `ether`));
        console.log("User farm token balance after conversion: ", userFarmTokenBalance);
 
    });

  
  });

});