import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  createProposalWithSigner,
  fetchProposalThreshold,
  fetchVotingPower,
} from "../services/governance";
import { useWallet } from "../wallet/WalletContext";

type ChangeEventLike = {
  target: {
    value: string;
  };
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Failed to create proposal";
}

export function CreateProposalScreen({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) {
  const { address, signer } = useWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<bigint | null>(null);
  const [power, setPower] = useState<bigint | null>(null);

  const descriptionHash = useMemo(() => {
    return ethers.id(description || "");
  }, [description]);

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        const t = await fetchProposalThreshold();
        if (!mounted) return;
        setThreshold(t);
        if (address) {
          const p = await fetchVotingPower(address);
          if (!mounted) return;
          setPower(p);
        } else {
          setPower(null);
        }
      } catch {
        if (!mounted) return;
        setThreshold(null);
        setPower(null);
      }
    };
    void loadStats();
    return () => {
      mounted = false;
    };
  }, [address]);

  const canSubmit = Boolean(signer && title.trim().length > 2 && description.trim().length > 4);

  const submit = useCallback(async () => {
    if (!signer) {
      setError("Connect wallet before creating a proposal.");
      return;
    }
    setBusy(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await createProposalWithSigner(signer, title.trim(), descriptionHash);
      setTxHash(hash);
      setTitle("");
      setDescription("");
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [descriptionHash, signer, title]);

  return (
    <section style={styles.container}>
      <button type="button" style={styles.back} onClick={onBack}>
        <span style={styles.backText}>Back to proposals</span>
      </button>

      <div style={styles.content}>
        <article style={styles.card}>
          <h2 style={styles.title}>New Governance Proposal</h2>
          <p style={styles.helper}>
            The description is hashed on-device and sent as `bytes32` to the contract.
          </p>
          <p style={styles.meta}>Proposal threshold: {threshold !== null ? threshold.toString() : "-"}</p>
          <p style={styles.meta}>Your voting power: {power !== null ? power.toString() : "-"}</p>

          <input
            style={styles.input}
            value={title}
            onChange={(event: ChangeEventLike) => setTitle(event.target.value)}
            placeholder="Proposal title"
          />

          <textarea
            style={{ ...styles.input, ...styles.textarea }}
            value={description}
            onChange={(event: ChangeEventLike) => setDescription(event.target.value)}
            placeholder="Proposal description"
          />

          <p style={styles.hashLabel}>Description hash</p>
          <p style={styles.hash}>{descriptionHash}</p>

          <button
            type="button"
            style={{ ...styles.submit, ...((!canSubmit || busy) ? styles.disabled : {}) }}
            disabled={!canSubmit || busy}
            onClick={submit}
          >
            <span style={styles.submitText}>{busy ? "Submitting..." : "Create Proposal"}</span>
          </button>
          <button type="button" style={styles.secondary} onClick={onCreated}>
            <span style={styles.secondaryText}>Go to proposals list</span>
          </button>

          {txHash && <p style={styles.success}>Submitted tx: {txHash}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </article>
      </div>
    </section>
  );
}

const styles = {
  container: { minHeight: "56vh" },
  content: { paddingBottom: 24, marginTop: 10, display: "grid", gap: 10 },
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
  title: {
    color: "#f5f9fc",
    fontSize: 20,
    fontWeight: 800,
    margin: "0 0 8px",
  },
  helper: {
    color: "#bed3e2",
    margin: "0 0 8px",
  },
  meta: {
    color: "#9ebccc",
    fontSize: 13,
    margin: "0 0 6px",
  },
  input: {
    border: "1px solid #32506d",
    borderRadius: 10,
    padding: "10px 12px",
    color: "#eef6fb",
    backgroundColor: "#0e2235",
    width: "100%",
    boxSizing: "border-box" as const,
    marginTop: 8,
  },
  textarea: {
    minHeight: 120,
    resize: "vertical" as const,
  },
  hashLabel: {
    color: "#9ebccc",
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 4,
  },
  hash: {
    color: "#d6e5ef",
    fontSize: 12,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    margin: 0,
    wordBreak: "break-all" as const,
  },
  submit: {
    minHeight: 46,
    borderRadius: 12,
    border: 0,
    cursor: "pointer",
    backgroundColor: "#e36414",
    marginTop: 12,
    width: "100%",
  },
  submitText: {
    color: "#fff",
    fontWeight: 800,
  },
  secondary: {
    minHeight: 44,
    borderRadius: 10,
    border: "1px solid #32506d",
    cursor: "pointer",
    backgroundColor: "#0f2134",
    width: "100%",
    marginTop: 8,
  },
  secondaryText: {
    color: "#d1e1ec",
    fontWeight: 700,
  },
  disabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  success: {
    color: "#83f2b0",
    marginTop: 8,
    marginBottom: 0,
  },
  error: {
    color: "#ff8f8f",
    marginTop: 8,
    marginBottom: 0,
  },
};
