'use client';

import { Loader2, LogOut, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface ConnectWalletButtonProps {
    fullWidth?: boolean;
}

export default function ConnectWalletButton({
    fullWidth = false,
}: ConnectWalletButtonProps) {
    const {
        connect,
        disconnect,
        error,
        hasMetaMask,
        isConnected,
        isConnecting,
        isReady,
        shortAddress,
    } = useWallet();

    if (!isReady) {
        return (
            <div
                className={`h-12 rounded-2xl border border-white/10 bg-white/[0.04] ${
                    fullWidth ? 'w-full' : 'w-44'
                }`}
            />
        );
    }

    if (!hasMetaMask) {
        return (
            <div
                className={`rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ${
                    fullWidth ? 'w-full' : ''
                }`}
            >
                Install MetaMask to use ShadowPay.
            </div>
        );
    }

    if (isConnected) {
        return (
            <div
                className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 ${
                    fullWidth ? 'w-full justify-between' : ''
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-200">
                        <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Connected</p>
                        <p className="text-sm font-medium text-white">{shortAddress}</p>
                    </div>
                </div>
                <button
                    className="btn-ghost inline-flex items-center gap-2"
                    onClick={disconnect}
                    type="button"
                >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className={fullWidth ? 'w-full' : ''}>
            <button
                className={`btn-primary inline-flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''}`}
                onClick={connect}
                type="button"
            >
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error ? <p className="mt-2 text-sm text-rose-200">{error}</p> : null}
        </div>
    );
}
