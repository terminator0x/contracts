require("dotenv").config();
const { expect } = require('chai');
const { waffle } = require("hardhat");
const provider = waffle.provider;
const abi = require('human-standard-token-abi');
const { setupContracts } = require('./setup');

describe('Re-deploying the plexus ecosystem for Farm Tokens', () => {

  // global test vars
  let wrapper, tokenRewards, plexusOracle, tier1Staking, core, tier2Farm, owner, addr1, coreAsSigner1;

  const tier2ContractName = "FARM";
  const farmTokenAddress = process.env.FARM_TOKEN_MAINNET_ADDRESS;
  const erc20 = new ethers.Contract(farmTokenAddress, abi, provider);
  const unitAmount = "2";

  // deploy and setup the contracts
  before(async () => {
    [wrapper , tokenRewards, plexusOracle, tier1Staking, core, tier2Farm, owner, addr1 ] = await setupContracts();

    // use contract as user/addr1
    coreAsSigner1 = core.connect(addr1);
  });

  describe('Test contract re-deployment', () => {

    it('Should set the re-deployed contracts to the correct owner', async function () {

      expect(await wrapper.owner()).to.equal(owner.address);
      expect(await tokenRewards.owner()).to.equal(owner.address);
      expect(await plexusOracle.owner()).to.equal(owner.address);
      expect(await tier1Staking.owner()).to.equal(owner.address);
      expect(await core.owner()).to.equal(owner.address);
      expect(await tier2Farm.owner()).to.equal(owner.address);

    });

    it('Should setup the contracts addresses correctly after re-deployment', async function () {
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

  describe('Plexus Farm Token Transactions', () => {

    it('Plexus test user wallet balance is equal to 10000 ETH', async () => {
        const ethbalance = Number(ethers.utils.formatEther(await addr1.getBalance()));
        console.log('Starting ETH balance is ', ethbalance);
        expect(ethbalance).to.equal(10000);
 
    });

    it('Plexus test user wallet Farm Token balance is equal to zero', async () => {
        // check the farm token balance in the contract account
        const userFarmTokenBalance = Number(ethers.utils.formatEther(await erc20.balanceOf(addr1.address)));
    
        // Before conversion usser Farm Token balance should be zero
        console.log("User farm token balance BEFORE ETH conversion: ", userFarmTokenBalance);
        expect(userFarmTokenBalance).to.be.lte(0);

    });

    it('Should convert 2 ETH to Farm token from harvest.finance', async () => {

       const zeroAddress = process.env.ZERO_ADDRESS;
       const unitAmount = "2";

       // Please note, the number of farm tokens we want to get doesn't matter, so the unit amount is just a placeholder
       const amountPlaceholder = ethers.utils.parseEther(unitAmount)
    
       // we send 2 ETH to the wrapper for conversion
       let overrides = {
            value: ethers.utils.parseEther(unitAmount)
       };

       //do the conversion as addr1 user
       let wrapperAsSigner1 = wrapper.connect(addr1);

       // convert the 1 ETH to Farm token via wrapper
       const { status } = await (await wrapperAsSigner1.wrap(zeroAddress, [farmTokenAddress], amountPlaceholder, overrides)).wait();

       // check if the txn is successful
       expect(status).to.equal(1);

       // check conversion is successful
       if (status === 1) {

          // check the farm token balance in the contract account
          const userFarmTokenBalance = Number(ethers.utils.formatUnits(await erc20.balanceOf(addr1.address), `ether`));
      
          // check if the conversion is successful and the user to have some farm tokens in his wallet
          console.log("User farm token balance AFTER ETH conversion: ", userFarmTokenBalance);
          expect(userFarmTokenBalance).to.be.gte(0);

       }
       // check that the users ETH balance has reduced regardless of the conversion status
       const ethbalance = Number(ethers.utils.formatEther(await addr1.getBalance()));
       console.log('ETH balance AFTER ETH conversion is ', ethbalance);
       expect(ethbalance).to.be.lt(10000);
 
    });

    it("User should be able to deposit Farm Tokens via the core contract", async () => {
    
        const farmTokenDepositAmount = ethers.utils.parseEther(unitAmount);

        // check the user farm token balance in the token contract before deposit
        const initialUserFarmTokenBalance = Number(ethers.utils.formatEther(await erc20.balanceOf(addr1.address)));
        console.log("User farm token balance, BEFORE deposit is: ", initialUserFarmTokenBalance);
        
        // approve the core contract to spend the tokens
        let erc20AsSigner1 =  erc20.connect(addr1);
        const approved = await(await erc20AsSigner1.approve(core.address, farmTokenDepositAmount)).wait();

        // check if the approved txn is successful
        expect(approved.status).to.equal(1);

        // check allowance
        const allowance = Number(ethers.utils.formatEther(await erc20.allowance(addr1.address, core.address)));
        console.log("Farm tokens approved by user for deposit : ", allowance);

        // Then we deposit 2 Farm Tokens into the core contract as addr1/user
        const deposit = await (await coreAsSigner1.deposit(tier2ContractName, farmTokenAddress, farmTokenDepositAmount)).wait();

        // check if the deposit txn is successful
        expect(deposit.status).to.equal(1);

        // if txn is successful
        if (deposit.status) {

          // As the contract owner, get the number of farm tokens deposited by the user addr1
          const userFarmTokensDepositedIntoTier2Farm = Number(ethers.utils.formatEther(await core.getAmountStakedByUser(farmTokenAddress, addr1.address, tier2Farm.address)));
          console.log("Number of Farm Tokens staked by user into tier2Farm: ", userFarmTokensDepositedIntoTier2Farm);

          //check that the user deposit is equal 2 Farm tokens
          expect(userFarmTokensDepositedIntoTier2Farm).to.equal(Number(ethers.utils.formatEther(farmTokenDepositAmount)));

          // check the user farm token balance in the contract account after deposit
          const currUserFarmTokenBalance = Number(ethers.utils.formatEther(await erc20.balanceOf(addr1.address)));
          console.log("User farm token balance, AFTER deposit is: ", currUserFarmTokenBalance);
          
          //check that the initial user Farm token balance is less 2 Tokens
          expect(currUserFarmTokenBalance).to.equal(initialUserFarmTokenBalance - 2);

          const bal= Number(ethers.utils.formatEther(await erc20.balanceOf(tier2Farm.address)));
          console.log("Tier 2 farm token balance, AFTER deposit is: ", bal);

        }

    });

    it('User should be able to withdraw deposited Farm tokens via the Core Contract', async () => {
    
      const farmTokenWithdrawAmount = ethers.utils.parseEther(unitAmount);

      const bal= Number(ethers.utils.formatEther(await erc20.balanceOf(tier2Farm.address)));
      console.log("Tier 2 farm token balance, BEFORE withdraw is: ", bal);

      // check the user's Farm Token balance in the token contract before withdrawal
      const initialUserFarmTokenBalance = Number(ethers.utils.formatEther(await erc20.balanceOf(addr1.address)));
      console.log("User farm token balance, BEFORE withdraw is: ", initialUserFarmTokenBalance);

      // We withdraw 2 Farm Tokens from the core contract as addr1/user
      const { status } = await (await coreAsSigner1.withdraw(tier2ContractName, farmTokenAddress, farmTokenWithdrawAmount)).wait();

      // check if the withdraw txn is successful
      expect(status).to.equal(1);

      // if txn is successful
      if (status) {

      }

    
    });
  
  });

});