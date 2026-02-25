import React, { useMemo, useState } from "react";
import { WalletProvider } from "./wallet/WalletContext";
import { WalletScreen } from "./screens/WalletScreen";
import { ProposalsScreen } from "./screens/ProposalsScreen";
import { ProposalDetailsScreen } from "./screens/ProposalDetailsScreen";
import { CreateProposalScreen } from "./screens/CreateProposalScreen";

type RouteName = "wallet" | "proposals" | "create" | "details";

function Shell() {
  const [route, setRoute] = useState<RouteName>("wallet");
  const [selectedProposalId, setSelectedProposalId] = useState<bigint | null>(null);

  const title = useMemo(() => {
    if (route === "wallet") return "Wallet";
    if (route === "proposals") return "Proposals";
    if (route === "create") return "Create Proposal";
    return selectedProposalId ? `Proposal #${selectedProposalId}` : "Proposal";
  }, [route, selectedProposalId]);

  const openDetails = (id: bigint) => {
    setSelectedProposalId(id);
    setRoute("details");
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundOrbA} />
      <div style={styles.backgroundOrbB} />

      <header style={styles.header}>
        <p style={styles.kicker}>POLLY VOTE</p>
        <h1 style={styles.title}>{title}</h1>
      </header>

      <main style={styles.body}>
        {route === "wallet" && <WalletScreen />}
        {route === "proposals" && (
          <ProposalsScreen onOpenProposal={openDetails} onCreateProposal={() => setRoute("create")} />
        )}
        {route === "create" && (
          <CreateProposalScreen
            onBack={() => setRoute("proposals")}
            onCreated={() => setRoute("proposals")}
          />
        )}
        {route === "details" && selectedProposalId !== null && (
          <ProposalDetailsScreen proposalId={selectedProposalId} onBack={() => setRoute("proposals")} />
        )}
      </main>

      <nav style={styles.nav}>
        <NavButton
          label="Wallet"
          active={route === "wallet"}
          onPress={() => setRoute("wallet")}
        />
        <NavButton
          label="Proposals"
          active={route === "proposals" || route === "details"}
          onPress={() => setRoute("proposals")}
        />
        <NavButton
          label="Create"
          active={route === "create"}
          onPress={() => setRoute("create")}
        />
      </nav>
    </div>
  );
}

function NavButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        ...styles.navButton,
        ...(active ? styles.navButtonActive : {}),
      }}
    >
      <span style={{ ...styles.navText, ...(active ? styles.navTextActive : {}) }}>{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <Shell />
    </WalletProvider>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative" as const,
    overflow: "hidden" as const,
    backgroundColor: "#091423",
    color: "#f4f8fb",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
    display: "flex",
    flexDirection: "column" as const,
  },
  backgroundOrbA: {
    position: "absolute" as const,
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: "50%",
    backgroundColor: "#1f6f78",
    opacity: 0.28,
  },
  backgroundOrbB: {
    position: "absolute" as const,
    bottom: -90,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: "50%",
    backgroundColor: "#e36414",
    opacity: 0.2,
  },
  header: {
    padding: "24px 18px 8px",
    position: "relative" as const,
    zIndex: 1,
  },
  kicker: {
    color: "#8ab8c2",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.4,
    margin: 0,
  },
  title: {
    color: "#f4f8fb",
    fontSize: 28,
    fontWeight: 800,
    margin: "4px 0 0",
  },
  body: {
    flex: 1,
    padding: "0 16px 8px",
    position: "relative" as const,
    zIndex: 1,
  },
  nav: {
    display: "flex",
    flexDirection: "row" as const,
    gap: 8,
    padding: "12px 14px",
    borderTop: "1px solid #1b2f42",
    backgroundColor: "rgba(3, 8, 14, 0.95)",
    position: "relative" as const,
    zIndex: 1,
  },
  navButton: {
    flex: 1,
    border: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#12263a",
    padding: "10px 12px",
  },
  navButtonActive: {
    backgroundColor: "#e36414",
  },
  navText: {
    color: "#b8cad6",
    fontWeight: 700,
  },
  navTextActive: {
    color: "#ffffff",
  },
};
