import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ethers } from "ethers";
import { CONFIG } from "../config";
import { getInjectedProvider, toEthersProvider } from "../wallet/wallet";
import type { InjectedProvider } from "../wallet/wallet";

type WalletState = {
  address: string | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  provider: InjectedProvider | null;
};

const Ctx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<InjectedProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const connect = useCallback(async () => {
    const injected = getInjectedProvider();
    if (!injected) {
      throw new Error("No injected wallet found. Install MetaMask or another EIP-1193 wallet.");
    }

    const ethersProvider = toEthersProvider(injected);
    const accounts = (await ethersProvider.send("eth_requestAccounts", [])) as string[];
    if (!Array.isArray(accounts) || !accounts[0]) {
      throw new Error("Wallet returned no account.");
    }

    const network = await ethersProvider.getNetwork();
    if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
      throw new Error(`Wrong network. Expected chain ID ${CONFIG.CHAIN_ID}.`);
    }

    const nextSigner = await ethersProvider.getSigner();
    setProvider(injected);
    setAddress(accounts[0]);
    setSigner(nextSigner);
  }, []);

  const disconnect = useCallback((): Promise<void> => {
    setProvider(null);
    setAddress(null);
    setSigner(null);
    return Promise.resolve();
  }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const injected = getInjectedProvider();
      if (!injected) return;

      const ethersProvider = toEthersProvider(injected);
      const accounts = (await ethersProvider.send("eth_accounts", [])) as string[];
      if (!mounted || !Array.isArray(accounts) || !accounts[0]) return;

      const nextSigner = await ethersProvider.getSigner();
      if (!mounted) return;
      setProvider(injected);
      setAddress(accounts[0]);
      setSigner(nextSigner);
    };

    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ address, signer, connect, disconnect, provider }),
    [address, signer, connect, disconnect, provider]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("WalletContext not found");
  return v;
}
