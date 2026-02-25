export const GOVERNANCE_ABI = [
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256 id) view returns (string title, bytes32 descriptionHash, uint64 startTime, uint64 endTime, uint256 totalStakedSnapshot, uint256 quorumBpsSnapshot, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint8 status)",
  "function votes(uint256 id, address user) view returns (uint8)",
  "function quorumReached(uint256 id) view returns (bool)",
  "function passed(uint256 id) view returns (bool)",
  "function proposalThreshold() view returns (uint256)",
  "function createProposal(string title, bytes32 descriptionHash) returns (uint256)",
  "function vote(uint256 id, uint8 choice)",
  "function finalize(uint256 id)",
] as const;

export const STAKING_ABI = [
  "function balanceOf(address user) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
] as const;
