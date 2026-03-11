'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
    isReady: boolean;
    isConnected: boolean;
    hasMetaMask: boolean;
    isSepolia: boolean;
    address: string | null;
    shortAddress: string | null;
    balance: string | null;
    chainId: string | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    ensureSepoliaNetwork: () => Promise<boolean>;
    isConnecting: boolean;
    error: string | null;
}

const WalletContext = createContext<WalletContextType>({
    isReady: false,
    isConnected: false,
    hasMetaMask: false,
    isSepolia: false,
    address: null,
    shortAddress: null,
    balance: null,
    chainId: null,
    provider: null,
    signer: null,
    connect: async () => {},
    disconnect: () => {},
    ensureSepoliaNetwork: async () => false,
    isConnecting: false,
    error: null,
});

const SEPOLIA_CHAIN_ID = '11155111';
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

function getBrowserProvider() {
    if (typeof window === 'undefined' || !window.ethereum) {
        return null;
    }

    return new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [hasMetaMask, setHasMetaMask] = useState(false);
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
    const isSepolia = chainId === SEPOLIA_CHAIN_ID;

    const resetWallet = useCallback(() => {
        setIsConnected(false);
        setAddress(null);
        setBalance(null);
        setChainId(null);
        setProvider(null);
        setSigner(null);
    }, []);

    const hydrateWallet = useCallback(
        async (requestAccounts: boolean) => {
            const browserProvider = getBrowserProvider();

            if (!browserProvider) {
                setHasMetaMask(false);
                setError('Install MetaMask to use ShadowPay.');
                resetWallet();
                return false;
            }

            setHasMetaMask(true);
            setError(null);

            const method = requestAccounts ? 'eth_requestAccounts' : 'eth_accounts';
            const accounts = (await browserProvider.send(method, [])) as string[];

            if (!accounts.length) {
                localStorage.removeItem('shadowpay_wallet_connected');
                resetWallet();
                return false;
            }

            const walletSigner = await browserProvider.getSigner();
            const walletAddress = await walletSigner.getAddress();
            const walletBalance = await browserProvider.getBalance(walletAddress);
            const network = await browserProvider.getNetwork();

            setProvider(browserProvider);
            setSigner(walletSigner);
            setAddress(walletAddress);
            setBalance(Number.parseFloat(ethers.formatEther(walletBalance)).toFixed(4));
            setChainId(network.chainId.toString());
            setIsConnected(true);
            return true;
        },
        [resetWallet]
    );

    const connect = useCallback(async () => {
        setIsConnecting(true);

        try {
            const connected = await hydrateWallet(true);

            if (connected) {
                localStorage.setItem('shadowpay_wallet_connected', 'true');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(message);
            resetWallet();
        } finally {
            setIsConnecting(false);
        }
    }, [hydrateWallet, resetWallet]);

    const disconnect = useCallback(() => {
        localStorage.removeItem('shadowpay_wallet_connected');
        setError(null);
        resetWallet();
    }, [resetWallet]);

    const ensureSepoliaNetwork = useCallback(async () => {
        if (typeof window === 'undefined' || !window.ethereum?.request) {
            setError('Install MetaMask to use ShadowPay.');
            return false;
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
            });
            await hydrateWallet(false);
            return true;
        } catch (error) {
            const code = typeof error === 'object' && error && 'code' in error
                ? Number((error as { code?: number }).code)
                : null;

            if (code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: SEPOLIA_CHAIN_ID_HEX,
                            chainName: 'Sepolia',
                            nativeCurrency: {
                                name: 'Sepolia ETH',
                                symbol: 'ETH',
                                decimals: 18,
                            },
                            rpcUrls: ['https://rpc.sepolia.org'],
                            blockExplorerUrls: ['https://sepolia.etherscan.io'],
                        },
                    ],
                });
                await hydrateWallet(false);
                return true;
            }

            setError('Failed to switch wallet to Sepolia.');
            return false;
        }
    }, [hydrateWallet]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        setHasMetaMask(Boolean(window.ethereum));

        async function bootstrapWallet() {
            if (localStorage.getItem('shadowpay_wallet_connected') && window.ethereum) {
                await hydrateWallet(false).catch(() => {
                    resetWallet();
                });
            }

            setIsReady(true);
        }

        bootstrapWallet();
    }, [hydrateWallet, resetWallet]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.ethereum?.on) {
            return;
        }

        const handleAccountsChanged = async (accounts: string[]) => {
            if (!accounts.length) {
                disconnect();
                return;
            }

            await hydrateWallet(false);
        };

        const handleChainChanged = async () => {
            await hydrateWallet(false);
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
            window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
        };
    }, [disconnect, hydrateWallet]);

    return (
        <WalletContext.Provider
            value={{
                isReady,
                isConnected,
                hasMetaMask,
                isSepolia,
                address,
                shortAddress,
                balance,
                chainId,
                provider,
                signer,
                connect,
                disconnect,
                ensureSepoliaNetwork,
                isConnecting,
                error,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    return useContext(WalletContext);
}
