import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("GovernanceToken");
  const token = await Token.deploy("GovernanceToken", "GOV");
  await token.waitForDeployment();

  // rewardRate: 0.1 token/sec (demo-friendly)
  const rewardRate = ethers.parseEther("0.1");
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(await token.getAddress(), await token.getAddress(), rewardRate);
  await staking.waitForDeployment();

  // Governance params
  const votingPeriod = 3 * 24 * 60 * 60; // 3 days
  const quorumBps = 1000;                // 10%
  const threshold = ethers.parseEther("100"); // optional threshold
  const Governance = await ethers.getContractFactory("Governance");
  const gov = await Governance.deploy(await staking.getAddress(), votingPeriod, quorumBps, threshold);
  await gov.waitForDeployment();

  // Fund staking rewards so claim() works
  await token.mint(await staking.getAddress(), ethers.parseEther("100000"));

  console.log("Deployer:", deployer.address);
  console.log("Token:", await token.getAddress());
  console.log("Staking:", await staking.getAddress());
  console.log("Governance:", await gov.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
