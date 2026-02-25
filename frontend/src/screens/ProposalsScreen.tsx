import React, { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProposalsLatestFirst, Proposal, Status } from "../services/governance";

function formatDate(ts: bigint) {
  return new Date(Number(ts) * 1000).toLocaleString();
}

function statusLabel(p: Proposal) {
  if (p.status === Status.Finalized) return "Finalized";
  return Number(p.endTime) * 1000 > Date.now() ? "Active" : "Awaiting Finalize";
}

function totalVotes(p: Proposal) {
  return p.forVotes + p.againstVotes + p.abstainVotes;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Failed to fetch proposals";
}

export function ProposalsScreen({
  onOpenProposal,
  onCreateProposal,
}: {
  onOpenProposal: (id: bigint) => void;
  onCreateProposal: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Proposal[]>([]);

  const load = useCallback(async (mode: "load" | "refresh") => {
    if (mode === "load") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      const next = await fetchProposalsLatestFirst(50);
      setItems(next);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load("load");
  }, [load]);

  const emptyText = useMemo(() => {
    if (loading) return "";
    return "No proposals yet. Create the first one.";
  }, [loading]);

  return (
    <section style={styles.container}>
      <div style={styles.row}>
        <button type="button" style={styles.primaryButton} onClick={onCreateProposal}>
          <span style={styles.primaryButtonText}>New Proposal</span>
        </button>
        <button type="button" style={styles.ghostButton} onClick={() => load("refresh")}>
          <span style={styles.ghostButtonText}>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <div style={styles.center}>Loading proposals...</div>
      ) : (
        <div style={styles.list}>
          {items.length === 0 ? (
            <p style={styles.empty}>{emptyText}</p>
          ) : (
            items.map((item: Proposal) => (
              <button
                type="button"
                key={item.id.toString()}
                style={styles.card}
                onClick={() => onOpenProposal(item.id)}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.cardId}>#{item.id.toString()}</span>
                  <span style={styles.badge}>{statusLabel(item)}</span>
                </div>
                <h3 style={styles.cardTitle}>{item.title}</h3>
                <p style={styles.cardMeta}>Ends: {formatDate(item.endTime)}</p>
                <p style={styles.cardMeta}>Total votes: {totalVotes(item).toString()}</p>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}

const styles = {
  container: { minHeight: "56vh" },
  row: {
    display: "flex",
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    border: 0,
    cursor: "pointer",
    backgroundColor: "#e36414",
    borderRadius: 12,
    minHeight: 44,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: 800,
  },
  ghostButton: {
    minWidth: 102,
    borderRadius: 12,
    border: "1px solid #32506d",
    cursor: "pointer",
    backgroundColor: "#0f2134",
    padding: "0 12px",
  },
  ghostButtonText: {
    color: "#d1e1ec",
    fontWeight: 700,
  },
  error: {
    color: "#ff8f8f",
    marginBottom: 10,
    marginTop: 0,
  },
  center: {
    minHeight: 180,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#d6e5ef",
  },
  list: {
    paddingBottom: 22,
    display: "grid",
    gap: 10,
  },
  empty: {
    color: "#c4d7e5",
    textAlign: "center",
    marginTop: 24,
  },
  card: {
    borderRadius: 14,
    border: "1px solid #24455f",
    backgroundColor: "rgba(14, 33, 51, 0.86)",
    padding: 14,
    textAlign: "left" as const,
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardId: {
    color: "#91bbcf",
    fontWeight: 700,
  },
  badge: {
    display: "inline-block",
    color: "#ffd7bd",
    backgroundColor: "#663018",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  cardTitle: {
    color: "#f4f8fb",
    fontSize: 17,
    fontWeight: 800,
    margin: "0 0 6px",
  },
  cardMeta: {
    color: "#bdd2e0",
    fontSize: 13,
    margin: 0,
  },
};
