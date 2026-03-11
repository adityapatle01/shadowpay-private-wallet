export {};

declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: boolean;
            request?: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
            on?: (event: string, listener: (...args: any[]) => void) => void;
            removeListener?: (event: string, listener: (...args: any[]) => void) => void;
        };
    }
}
