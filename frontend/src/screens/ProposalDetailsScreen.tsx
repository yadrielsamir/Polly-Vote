import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Choice,
  fetchPassed,
  fetchProposal,
  fetchQuorumReached,
  fetchUserVote,
  finalizeWithSigner,
  Proposal,
  Status,
  voteWithSigner,
} from "../services/governance";
import { useWallet } from "../wallet/WalletContext";

function formatDate(ts: bigint) {
  return new Date(Number(ts) * 1000).toLocaleString();
}

function choiceLabel(choice: Choice) {
  if (choice === Choice.For) return "For";
  if (choice === Choice.Against) return "Against";
  if (choice === Choice.Abstain) return "Abstain";
  return "Not voted";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed";
}

export function ProposalDetailsScreen({
  proposalId,
  onBack,
}: {
  proposalId: bigint;
  onBack: () => void;
}) {
  const { address, signer } = useWallet();
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [myVote, setMyVote] = useState<Choice>(Choice.None);
  const [quorum, setQuorum] = useState(false);
  const [passed, setPassed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, q, ok] = await Promise.all([
        fetchProposal(proposalId),
        fetchQuorumReached(proposalId),
        fetchPassed(proposalId),
      ]);
      setProposal(p);
      setQuorum(q);
      setPassed(ok);
      if (address) {
        const v = await fetchUserVote(proposalId, address);
        setMyVote(v);
      } else {
        setMyVote(Choice.None);
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [address, proposalId]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const ended = useMemo(() => {
    if (!proposal) return false;
    return Number(proposal.endTime) * 1000 <= now;
  }, [now, proposal]);

  const canVote = Boolean(
    proposal &&
      proposal.status === Status.Active &&
      !ended &&
      myVote === Choice.None &&
      signer
  );

  const canFinalize = Boolean(proposal && proposal.status === Status.Active && ended && signer);

  const onVote = useCallback(
    async (choice: Choice) => {
      if (!signer) {
        setError("Connect wallet to vote.");
        return;
      }
      setBusyAction(true);
      setError(null);
      setTxHash(null);
      try {
        const hash = await voteWithSigner(signer, proposalId, choice);
        setTxHash(hash);
        await load();
      } catch (e: unknown) {
        setError(getErrorMessage(e));
      } finally {
        setBusyAction(false);
      }
    },
    [load, proposalId, signer]
  );

  const onFinalize = useCallback(async () => {
    if (!signer) {
      setError("Connect wallet to finalize.");
      return;
    }
    setBusyAction(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await finalizeWithSigner(signer, proposalId);
      setTxHash(hash);
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setBusyAction(false);
    }
  }, [load, proposalId, signer]);

  if (loading) {
    return (
      <div style={styles.center}>Loading proposal...</div>
    );
  }

  if (!proposal) {
    return (
      <div style={styles.center}>
        <p style={styles.error}>Proposal not found.</p>
      </div>
    );
  }

  return (
    <section style={styles.container}>
      <button type="button" style={styles.back} onClick={onBack}>
        <span style={styles.backText}>Back to proposals</span>
      </button>

      <div style={styles.content}>
        <article style={styles.card}>
          <p style={styles.id}>Proposal #{proposal.id.toString()}</p>
          <h2 style={styles.title}>{proposal.title}</h2>
          <p style={styles.meta}>Description hash: {proposal.descriptionHash}</p>
          <p style={styles.meta}>Start: {formatDate(proposal.startTime)}</p>
          <p style={styles.meta}>End: {formatDate(proposal.endTime)}</p>
          <p style={styles.meta}>Your vote: {choiceLabel(myVote)}</p>
        </article>

        <article style={styles.card}>
          <h3 style={styles.sectionTitle}>Results</h3>
          <p style={styles.meta}>For: {proposal.forVotes.toString()}</p>
          <p style={styles.meta}>Against: {proposal.againstVotes.toString()}</p>
          <p style={styles.meta}>Abstain: {proposal.abstainVotes.toString()}</p>
          <p style={styles.meta}>Quorum reached: {quorum ? "Yes" : "No"}</p>
          <p style={styles.meta}>Would pass: {passed ? "Yes" : "No"}</p>
          <p style={styles.meta}>
            Status: {proposal.status === Status.Finalized ? "Finalized" : ended ? "Awaiting Finalize" : "Active"}
          </p>
        </article>

        <article style={styles.card}>
          <h3 style={styles.sectionTitle}>Actions</h3>
          <div style={styles.actions}>
            <button
              type="button"
              style={{ ...styles.voteButton, ...((!canVote || busyAction) ? styles.disabled : {}) }}
              disabled={!canVote || busyAction}
              onClick={() => onVote(Choice.For)}
            >
              <span style={styles.voteText}>Vote For</span>
            </button>
            <button
              type="button"
              style={{ ...styles.voteButton, ...((!canVote || busyAction) ? styles.disabled : {}) }}
              disabled={!canVote || busyAction}
              onClick={() => onVote(Choice.Against)}
            >
              <span style={styles.voteText}>Vote Against</span>
            </button>
            <button
              type="button"
              style={{ ...styles.voteButton, ...((!canVote || busyAction) ? styles.disabled : {}) }}
              disabled={!canVote || busyAction}
              onClick={() => onVote(Choice.Abstain)}
            >
              <span style={styles.voteText}>Vote Abstain</span>
            </button>
            <button
              type="button"
              style={{ ...styles.finalizeButton, ...((!canFinalize || busyAction) ? styles.disabled : {}) }}
              disabled={!canFinalize || busyAction}
              onClick={onFinalize}
            >
              <span style={styles.finalizeText}>Finalize</span>
            </button>
          </div>
          {busyAction && <p style={styles.meta}>Submitting transaction...</p>}
          {txHash && <p style={styles.success}>Submitted tx: {txHash}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </article>
      </div>
    </section>
  );
}

const styles = {
  container: {
    minHeight: "56vh",
  },
  content: {
    display: "grid",
    gap: 10,
    paddingBottom: 24,
    marginTop: 10,
  },
  center: {
    minHeight: 180,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#d6e5ef",
  },
  back: {
    borderRadius: 8,
    backgroundColor: "#12263a",
    border: "1px solid #32506d",
    padding: "6px 10px",
    cursor: "pointer",
  },
  backText: {
    color: "#c7d9e7",
    fontWeight: 700,
  },
  card: {
    borderRadius: 14,
    border: "1px solid #24455f",
    backgroundColor: "rgba(14, 33, 51, 0.86)",
    padding: 14,
  },
  id: {
    color: "#9ec0d1",
    fontWeight: 700,
    margin: 0,
  },
  title: {
    color: "#f4f8fb",
    fontSize: 20,
    fontWeight: 800,
    margin: "8px 0 0",
  },
  sectionTitle: {
    color: "#f5f9fc",
    fontWeight: 800,
    fontSize: 16,
    margin: "0 0 6px",
  },
  meta: {
    color: "#bed3e2",
    margin: "0 0 6px",
  },
  actions: {
    display: "grid",
    gap: 8,
    marginTop: 2,
  },
  voteButton: {
    minHeight: 44,
    borderRadius: 10,
    border: 0,
    cursor: "pointer",
    backgroundColor: "#1e5f74",
  },
  voteText: {
    color: "#fff",
    fontWeight: 800,
  },
  finalizeButton: {
    minHeight: 44,
    borderRadius: 10,
    border: 0,
    cursor: "pointer",
    backgroundColor: "#e36414",
    marginTop: 4,
  },
  finalizeText: {
    color: "#fff",
    fontWeight: 800,
  },
  disabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  success: {
    color: "#83f2b0",
    marginTop: 6,
    marginBottom: 0,
  },
  error: {
    color: "#ff8f8f",
    marginTop: 6,
    marginBottom: 0,
  },
};
