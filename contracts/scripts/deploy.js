const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH');
  if (balance === 0n) {
    console.warn(
      '\n⚠️  Deployer has 0 ETH. Get free Sepolia testnet ETH from a faucet first, e.g.:\n' +
        '   https://sepoliafaucet.com\n' +
        '   https://www.alchemy.com/faucets/ethereum-sepolia\n'
    );
  }

  // 1. Deploy the NEX token — 1,000,000,000 NEX total supply, minted
  //    entirely to the deployer (matches the app's original demo supply).
  console.log('\nDeploying NexorumToken...');
  const Token = await hre.ethers.getContractFactory('NexorumToken');
  const token = await Token.deploy(1_000_000_000);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log('NexorumToken (NEX) deployed to:', tokenAddress);

  // 2. Deploy the staking contract, pointed at the token above.
  console.log('\nDeploying NexorumStaking...');
  const Staking = await hre.ethers.getContractFactory('NexorumStaking');
  const staking = await Staking.deploy(tokenAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log('NexorumStaking deployed to:', stakingAddress);

  // 3. Fund the staking contract's reward pool so users can actually
  //    claim rewards. Sends 5% of total supply (50,000,000 NEX) — adjust
  //    as you like; you can always fundRewardPool() more later.
  const rewardAmount = hre.ethers.parseUnits('50000000', 18);
  console.log('\nApproving and funding reward pool with 50,000,000 NEX...');
  const approveTx = await token.approve(stakingAddress, rewardAmount);
  await approveTx.wait();
  const fundTx = await staking.fundRewardPool(rewardAmount);
  await fundTx.wait();
  console.log('Reward pool funded.');

  console.log('\n=== DEPLOYMENT SUMMARY ===');
  console.log('NEX Token address:    ', tokenAddress);
  console.log('Staking contract addr:', stakingAddress);
  console.log('Network:              ', hre.network.name);
  console.log(
    '\nSave these two addresses — you\'ll need to give them to Claude to wire up ' +
      'the backend (cloudflare/worker.ts) and frontend to read/write real on-chain data.'
  );
  console.log(
    '\nView on Etherscan (once indexed):\n' +
      `  https://sepolia.etherscan.io/address/${tokenAddress}\n` +
      `  https://sepolia.etherscan.io/address/${stakingAddress}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
