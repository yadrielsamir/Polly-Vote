/*
  Temporary fallback React typings for offline environments.
  Remove this file after installing @types/react and @types/react-dom.
*/

declare module "react" {
  export type ReactNode = unknown;

  export interface Context<T> {
    Provider: (props: { value: T; children?: ReactNode }) => unknown;
    Consumer: (props: { children: (value: T) => ReactNode }) => unknown;
  }

  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useState<T>(
    initialState: T | (() => T)
  ): [T, (next: T | ((prev: T) => T)) => void];
  export function useEffect(
    effect: () => void | (() => void),
    deps?: readonly unknown[]
  ): void;
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: readonly unknown[]
  ): T;

  const React: {
    createElement: (...args: any[]) => unknown;
  };

  export default React;
}

declare module "react/jsx-runtime" {
  export const Fragment: unknown;
  export function jsx(type: any, props: any, key?: any): unknown;
  export function jsxs(type: any, props: any, key?: any): unknown;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
