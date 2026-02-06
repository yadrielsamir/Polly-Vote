// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IStaking {
    function balanceOf(address user) external view returns (uint256);
    function totalStaked() external view returns (uint256);
}

contract Governance {
    enum Choice { None, For, Against, Abstain }
    enum Status { Active, Finalized }

    struct Proposal {
        string title;
        bytes32 descriptionHash;
        uint64 startTime;
        uint64 endTime;

        uint256 totalStakedSnapshot;
        uint256 quorumBpsSnapshot;

        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;

        Status status;
    }

    IStaking public immutable staking;

    uint256 public votingPeriod;       // seconds
    uint256 public quorumBps;          // 1000 = 10%
    uint256 public proposalThreshold;  // 0 disables

    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Choice)) public votes;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        bytes32 descriptionHash,
        uint64 startTime,
        uint64 endTime,
        uint256 totalStakedSnapshot
    );
    event Voted(uint256 indexed proposalId, address indexed voter, Choice choice, uint256 weight);
    event Finalized(uint256 indexed proposalId, bool passed, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes);

    constructor(address stakingAddress, uint256 _votingPeriod, uint256 _quorumBps, uint256 _proposalThreshold) {
        require(stakingAddress != address(0), "staking=0");
        require(_quorumBps <= 10_000, "quorumBps>100%");
        staking = IStaking(stakingAddress);
        votingPeriod = _votingPeriod;
        quorumBps = _quorumBps;
        proposalThreshold = _proposalThreshold;
    }

    function createProposal(string calldata title, bytes32 descriptionHash) external returns (uint256) {
        uint256 staked = staking.balanceOf(msg.sender);
        require(staked >= proposalThreshold, "below threshold");

        uint64 start = uint64(block.timestamp);
        uint64 end = uint64(block.timestamp + votingPeriod);

        proposalCount += 1;
        uint256 id = proposalCount;

        Proposal storage p = proposals[id];
        p.title = title;
        p.descriptionHash = descriptionHash;
        p.startTime = start;
        p.endTime = end;
        p.totalStakedSnapshot = staking.totalStaked();
        p.quorumBpsSnapshot = quorumBps;
        p.status = Status.Active;

        emit ProposalCreated(id, msg.sender, title, descriptionHash, start, end, p.totalStakedSnapshot);
        return id;
    }

    function vote(uint256 proposalId, Choice choice) external {
        require(choice == Choice.For || choice == Choice.Against || choice == Choice.Abstain, "invalid choice");

        Proposal storage p = proposals[proposalId];
        require(bytes(p.title).length != 0, "proposal not found");
        require(p.status == Status.Active, "not active");
        require(block.timestamp >= p.startTime, "not started");
        require(block.timestamp < p.endTime, "ended");
        require(votes[proposalId][msg.sender] == Choice.None, "already voted");

        // v1: weight is current staked balance. (Step 4 upgrades to snapshot-at-creation via checkpoints.)
        uint256 weight = staking.balanceOf(msg.sender);
        require(weight > 0, "no voting power");

        votes[proposalId][msg.sender] = choice;

        if (choice == Choice.For) p.forVotes += weight;
        else if (choice == Choice.Against) p.againstVotes += weight;
        else p.abstainVotes += weight;

        emit Voted(proposalId, msg.sender, choice, weight);
    }

    function quorumReached(uint256 proposalId) public view returns (bool) {
        Proposal storage p = proposals[proposalId];
        uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        uint256 requiredVotes = (p.totalStakedSnapshot * p.quorumBpsSnapshot) / 10_000;
        return totalVotes >= requiredVotes;
    }

    function passed(uint256 proposalId) public view returns (bool) {
        Proposal storage p = proposals[proposalId];
        return p.forVotes > p.againstVotes;
    }

    function finalize(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(bytes(p.title).length != 0, "proposal not found");
        require(p.status == Status.Active, "already finalized");
        require(block.timestamp >= p.endTime, "still active");

        p.status = Status.Finalized;
        bool ok = quorumReached(proposalId) && passed(proposalId);

        emit Finalized(proposalId, ok, p.forVotes, p.againstVotes, p.abstainVotes);
    }
}
