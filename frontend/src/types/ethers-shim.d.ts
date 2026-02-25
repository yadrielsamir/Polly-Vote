/*
  Temporary fallback typings for offline environments where `ethers`
  cannot be installed. Remove this file once `pnpm install` succeeds.
*/

declare module "ethers" {
  namespace ethers {
    type Provider = unknown;
    type Signer = unknown;

    class BrowserProvider {
      constructor(provider: unknown);
      send(method: string, params: unknown[]): Promise<unknown>;
      getSigner(): Promise<Signer>;
      getNetwork(): Promise<{ chainId: bigint | number }>;
    }

    class JsonRpcProvider {
      constructor(url?: string, network?: number);
    }

    class Contract {
      [key: string]: any;
      constructor(address: string, abi: readonly unknown[] | unknown[], providerOrSigner: unknown);
    }

    function id(value: string): string;
  }

  const ethers: {
    BrowserProvider: typeof ethers.BrowserProvider;
    JsonRpcProvider: typeof ethers.JsonRpcProvider;
    Contract: typeof ethers.Contract;
    id: typeof ethers.id;
  };

  export { ethers };
}
