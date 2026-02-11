import { expect } from "chai";
import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.connect();

describe("Polly Vote v1 (Token + Staking + Governance)", function () {
  it("stakes, accrues rewards, and claims", async function () {
    const [deployer, alice] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("GovernanceToken");
    const token = await Token.deploy("GovernanceToken", "GOV");
    await token.waitForDeployment();

    await token.mint(alice.address, ethers.parseEther("1000"));

    const rewardRate = ethers.parseEther("0.1"); // 0.1 token/sec
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(
      await token.getAddress(),
      await token.getAddress(),
      rewardRate
    );
    await staking.waitForDeployment();

    // Fund rewards so claim() can pay out
    await token.mint(await staking.getAddress(), ethers.parseEther("10000"));

    const stakeAmount = ethers.parseEther("100");
    await token.connect(alice).approve(await staking.getAddress(), stakeAmount);
    await staking.connect(alice).stake(stakeAmount);

    expect(await staking.totalStaked()).to.equal(stakeAmount);
    expect(await staking.balanceOf(alice.address)).to.equal(stakeAmount);

    await networkHelpers.time.increase(30);

    const earned = await staking.earned(alice.address);
    expect(earned).to.be.gt(0n);

    const before = await token.balanceOf(alice.address);
    await staking.connect(alice).claim();
    const after = await token.balanceOf(alice.address);

    expect(after).to.be.gt(before);
  });

  it("creates proposal, votes, and finalizes (v1 weight = current staked at vote)", async function () {
    const [deployer, alice, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("GovernanceToken");
    const token = await Token.deploy("GovernanceToken", "GOV");
    await token.waitForDeployment();

    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(
      await token.getAddress(),
      await token.getAddress(),
      0
    );
    await staking.waitForDeployment();

    await token.mint(alice.address, ethers.parseEther("1000"));
    await token.mint(bob.address, ethers.parseEther("1000"));

    await token.connect(alice).approve(await staking.getAddress(), ethers.parseEther("20"));
    await staking.connect(alice).stake(ethers.parseEther("20"));

    await token.connect(bob).approve(await staking.getAddress(), ethers.parseEther("100"));
    await staking.connect(bob).stake(ethers.parseEther("100"));

    const votingPeriod = 3 * 24 * 60 * 60;
    const quorumBps = 1000;
    const threshold = 0;

    const Governance = await ethers.getContractFactory("Governance");
    const gov = await Governance.deploy(
      await staking.getAddress(),
      votingPeriod,
      quorumBps,
      threshold
    );
    await gov.waitForDeployment();

    const title = "Test Proposal";
    const descriptionHash = ethers.keccak256(
      ethers.toUtf8Bytes("Proposal details stored off-chain")
    );

    const tx = await gov.connect(alice).createProposal(title, descriptionHash);
    const receipt = await tx.wait();

    const created = receipt!.logs
      .map((l: any) => {
        try { return gov.interface.parseLog(l); } catch { return null; }
      })
      .find((e: any) => e && e.name === "ProposalCreated");

    expect(created).to.not.equal(undefined);
    const proposalId = created!.args.id as bigint;

    // Choice enum: None=0, For=1, Against=2, Abstain=3
    await gov.connect(alice).vote(proposalId, 1);
    await gov.connect(bob).vote(proposalId, 2);

    const p = await gov.proposals(proposalId);
    expect(p.forVotes).to.equal(ethers.parseEther("20"));
    expect(p.againstVotes).to.equal(ethers.parseEther("100"));

    await networkHelpers.time.increase(votingPeriod + 1);

    await gov.finalize(proposalId);

    const p2 = await gov.proposals(proposalId);
    expect(p2.status).to.equal(1); // Finalized
    expect(await gov.passed(proposalId)).to.equal(false);
  });
});
