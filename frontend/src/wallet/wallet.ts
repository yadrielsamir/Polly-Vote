import { ethers } from "ethers";

type RequestArgs = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

export type InjectedProvider = {
  request: (args: RequestArgs) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export function getInjectedProvider(): InjectedProvider | null {
  const maybeGlobal = globalThis as { ethereum?: InjectedProvider } | undefined;
  return maybeGlobal?.ethereum ?? null;
}

export function toEthersProvider(provider: InjectedProvider) {
  // Keep this cast loose to avoid version-specific EIP-1193 type mismatches.
  return new ethers.BrowserProvider(provider as any);
}
