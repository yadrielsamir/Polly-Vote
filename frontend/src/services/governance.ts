import { ethers } from "ethers";
import { CONFIG } from "../config";
import { GOVERNANCE_ABI, STAKING_ABI } from "../contracts/abis";

export enum Choice {
  None = 0,
  For = 1,
  Against = 2,
  Abstain = 3,
}
export enum Status {
  Active = 0,
  Finalized = 1,
}

export type Proposal = {
  id: bigint;
  title: string;
  descriptionHash: string; // bytes32 hex
  startTime: bigint;
  endTime: bigint;
  totalStakedSnapshot: bigint;
  quorumBpsSnapshot: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  status: Status;
};

function governanceContract(providerOrSigner: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(CONFIG.GOVERNANCE_ADDRESS, GOVERNANCE_ABI, providerOrSigner);
}

function stakingContract(providerOrSigner: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(CONFIG.STAKING_ADDRESS, STAKING_ABI, providerOrSigner);
}

export function getReadProvider() {
  return new ethers.JsonRpcProvider(CONFIG.RPC_URL, CONFIG.CHAIN_ID);
}

export async function fetchProposalCount(): Promise<bigint> {
  const c = governanceContract(getReadProvider());
  return await c.proposalCount();
}

export async function fetchProposal(id: bigint): Promise<Proposal> {
  const c = governanceContract(getReadProvider());
  const p = await c.proposals(id);

  // p is a tuple in the same order as ABI
  return {
    id,
    title: p.title,
    descriptionHash: p.descriptionHash,
    startTime: BigInt(p.startTime),
    endTime: BigInt(p.endTime),
    totalStakedSnapshot: BigInt(p.totalStakedSnapshot),
    quorumBpsSnapshot: BigInt(p.quorumBpsSnapshot),
    forVotes: BigInt(p.forVotes),
    againstVotes: BigInt(p.againstVotes),
    abstainVotes: BigInt(p.abstainVotes),
    status: Number(p.status) as Status,
  };
}

export async function fetchProposalsLatestFirst(limit = 20): Promise<Proposal[]> {
  const count = await fetchProposalCount();
  const n = count > BigInt(limit) ? BigInt(limit) : count;

  const ids: bigint[] = [];
  for (let i = 0n; i < n; i++) {
    ids.push(count - i);
  }

  const proposals = await Promise.all(ids.map(fetchProposal));
  return proposals;
}

export async function fetchUserVote(id: bigint, user: string): Promise<Choice> {
  const c = governanceContract(getReadProvider());
  const v = await c.votes(id, user);
  return Number(v) as Choice;
}

export async function fetchQuorumReached(id: bigint): Promise<boolean> {
  const c = governanceContract(getReadProvider());
  return await c.quorumReached(id);
}

export async function fetchPassed(id: bigint): Promise<boolean> {
  const c = governanceContract(getReadProvider());
  return await c.passed(id);
}

export async function fetchVotingPower(user: string): Promise<bigint> {
  const s = stakingContract(getReadProvider());
  return await s.balanceOf(user);
}

export async function fetchTotalStaked(): Promise<bigint> {
  const s = stakingContract(getReadProvider());
  return await s.totalStaked();
}

export async function fetchProposalThreshold(): Promise<bigint> {
  const c = governanceContract(getReadProvider());
  return await c.proposalThreshold();
}

export async function createProposalWithSigner(
  signer: ethers.Signer,
  title: string,
  descriptionHash: string // bytes32
): Promise<string> {
  const c = governanceContract(signer);
  const tx = await c.createProposal(title, descriptionHash);
  return tx.hash;
}

export async function voteWithSigner(
  signer: ethers.Signer,
  id: bigint,
  choice: Choice
): Promise<string> {
  const c = governanceContract(signer);
  const tx = await c.vote(id, choice);
  return tx.hash;
}

export async function finalizeWithSigner(signer: ethers.Signer, id: bigint): Promise<string> {
  const c = governanceContract(signer);
  const tx = await c.finalize(id);
  return tx.hash;
}