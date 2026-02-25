import React, { useCallback, useState } from "react";
import { useWallet } from "../wallet/WalletContext";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unexpected wallet error";
}

export function WalletScreen() {
  const { address, connect, disconnect } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await connect();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [connect]);

  const onDisconnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await disconnect();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [disconnect]);

  return (
    <section style={styles.container}>
      <div style={styles.card}>
        <p style={styles.label}>Connection</p>
        <h2 style={styles.value}>{address ? "Connected" : "Not connected"}</h2>
        <p style={styles.helper}>
          {address
            ? `Address: ${shortenAddress(address)}`
            : "Connect MetaMask (or another browser wallet) to vote and create proposals."}
        </p>

        {!address ? (
          <button
            type="button"
            style={{ ...styles.button, ...(busy ? styles.buttonDisabled : {}) }}
            onClick={onConnect}
            disabled={busy}
          >
            <span style={styles.buttonText}>{busy ? "Connecting..." : "Connect Wallet"}</span>
          </button>
        ) : (
          <button
            type="button"
            style={{ ...styles.buttonAlt, ...(busy ? styles.buttonDisabled : {}) }}
            onClick={onDisconnect}
            disabled={busy}
          >
            <span style={styles.buttonAltText}>{busy ? "Disconnecting..." : "Disconnect"}</span>
          </button>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </section>
  );
}

const styles = {
  container: {
    minHeight: "56vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 18,
    border: "1px solid #254661",
    backgroundColor: "rgba(12, 30, 48, 0.82)",
    padding: 18,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#9ac0d4",
    fontWeight: 700,
    margin: 0,
  },
  value: {
    color: "#f2f7fb",
    fontSize: 24,
    fontWeight: 800,
    margin: "8px 0 0",
  },
  helper: {
    color: "#b8cfde",
    lineHeight: 1.5,
    margin: "10px 0 0",
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
    border: 0,
    cursor: "pointer",
    backgroundColor: "#e36414",
    minHeight: 46,
    width: "100%",
  },
  buttonAlt: {
    marginTop: 12,
    borderRadius: 12,
    border: "1px solid #45647f",
    cursor: "pointer",
    backgroundColor: "#13283d",
    minHeight: 46,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  buttonText: {
    color: "#fff",
    fontWeight: 800,
  },
  buttonAltText: {
    color: "#d9e8f4",
    fontWeight: 700,
  },
  error: {
    color: "#ff8f8f",
    marginTop: 10,
    marginBottom: 0,
  },
};
