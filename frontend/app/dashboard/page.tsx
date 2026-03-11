'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    History,
    Shield,
    Sparkles,
    Wallet,
} from 'lucide-react';
import PrivacyScoreCard from '@/components/dashboard/PrivacyScoreCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import { useWallet } from '@/context/WalletContext';
import { fetchTransactions } from '@/lib/api';
import { getAvailableStoredNotes } from '@/lib/notes';
import { getShadowPayContractAddress, hasShadowPayContractAddress } from '@/lib/shadowPay';
import type { PrivateTransaction, StoredShadowNote } from '@/lib/types';
import { formatAddress, formatPrivateBalance } from '@/lib/utils';

const FALLBACK_DEPOSIT_AMOUNT = '0.01';

export default function DashboardPage() {
    const {
        address,
        balance,
        chainId,
        ensureSepoliaNetwork,
        hasMetaMask,
        isConnected,
        isReady,
        isSepolia,
    } = useWallet();
    const [transactions, setTransactions] = useState<PrivateTransaction[]>([]);
    const [availableNotes, setAvailableNotes] = useState<StoredShadowNote[]>([]);
    const [fixedDepositAmount, setFixedDepositAmount] = useState(FALLBACK_DEPOSIT_AMOUNT);
    const [verifierAddress, setVerifierAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        function refreshLocalNotes() {
            if (!active) {
                return;
            }

            setAvailableNotes(getAvailableStoredNotes(address));
        }

        async function loadDashboard() {
            if (!isReady) {
                return;
            }

            refreshLocalNotes();
            setLoading(true);
            setError(null);

            try {
                const response = await fetchTransactions({
                    address: address || undefined,
                    limit: 6,
                });

                if (!active) {
                    return;
                }

                setTransactions(response.transactions);
                setFixedDepositAmount(response.fixedDepositAmountEth || FALLBACK_DEPOSIT_AMOUNT);
                setVerifierAddress(response.verifierAddress);
            } catch (err) {
                if (!active) {
                    return;
                }

                setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        const handleFocus = () => {
            refreshLocalNotes();
            void loadDashboard();
        };

        void loadDashboard();
        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', handleFocus);

        return () => {
            active = false;
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleFocus);
        };
    }, [address, isReady]);

    if (!isReady) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-3xl p-8">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Dashboard</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white">Loading wallet state</h1>
                </section>
            </div>
        );
    }

    const depositAmountNumber = Number.parseFloat(fixedDepositAmount || FALLBACK_DEPOSIT_AMOUNT);
    const privateBalance = availableNotes.length * depositAmountNumber;
    const privacyScore = transactions.length
        ? Math.round(
              transactions.reduce((sum, transaction) => sum + transaction.privacyIndicator, 0)
              / transactions.length
          )
        : 97;

    if (!hasMetaMask) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-3xl p-8">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Wallet required</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white">Connect a private payment wallet</h1>
                    <p className="mt-4 text-base leading-8 text-slate-300">
                        Install MetaMask to use ShadowPay.
                    </p>
                </section>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-4xl p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Dashboard</p>
                            <h1 className="mt-3 text-4xl font-semibold text-white">
                                Connect your wallet to enter the ShadowPay pool
                            </h1>
                            <p className="mt-4 text-base leading-8 text-slate-300">
                                ShadowPay uses MetaMask for Sepolia deposits and withdrawals, while
                                the note itself stays off-chain and unlocks private settlement later.
                            </p>
                        </div>
                        <ConnectWalletButton fullWidth />
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="section-shell pt-12">
            <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="glass-card overflow-hidden p-8">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div>
                            <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Privacy pool</p>
                            <h1 className="mt-3 text-4xl font-semibold text-white">
                                Shielded ETH settlement on Sepolia
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                                Deposit a fixed-size note into the ShadowPay pool, move the note
                                off-chain, and withdraw later without exposing a direct sender-to-receiver link.
                            </p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
                            Fixed pool note · {fixedDepositAmount} ETH
                        </div>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Wallet className="h-5 w-5 text-fuchsia-300" />
                                Connected wallet
                            </div>
                            <p className="mt-4 text-lg font-semibold text-white">{formatAddress(address)}</p>
                            <p className="mt-2 text-sm text-slate-400">
                                Chain ID {chainId || 'unknown'} · Public balance {balance || '0.0000'} ETH
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Shield className="h-5 w-5 text-sky-300" />
                                Private balance
                            </div>
                            <p className="mt-4 font-mono text-3xl text-white">
                                {formatPrivateBalance(privateBalance)}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                {availableNotes.length} unspent note{availableNotes.length === 1 ? '' : 's'} stored locally.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Sparkles className="h-5 w-5 text-cyan-300" />
                                Recent activity
                            </div>
                            <p className="mt-4 text-3xl font-semibold text-white">{transactions.length}</p>
                            <p className="mt-2 text-sm text-slate-400">
                                Deposits and withdrawals seen by this wallet.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link className="btn-primary inline-flex items-center gap-2" href="/deposit">
                            Deposit to Pool
                            <ArrowDownToLine className="h-4 w-4" />
                        </Link>
                        <Link className="btn-secondary inline-flex items-center gap-2" href="/withdraw">
                            Withdraw Note
                            <ArrowUpFromLine className="h-4 w-4" />
                        </Link>
                        <Link className="btn-secondary inline-flex items-center gap-2" href="/history">
                            Transaction History
                            <History className="h-4 w-4" />
                        </Link>
                        {!isSepolia ? (
                            <button
                                className="btn-secondary inline-flex items-center gap-2"
                                onClick={() => {
                                    void ensureSepoliaNetwork();
                                }}
                                type="button"
                            >
                                Switch to Sepolia
                            </button>
                        ) : null}
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <p className="text-sm text-slate-400">Pool contract</p>
                            <p className="mt-3 text-xl font-semibold text-white">
                                {hasShadowPayContractAddress()
                                    ? formatAddress(getShadowPayContractAddress())
                                    : 'Not configured'}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                Deposits publish only commitments. Withdrawals spend nullifiers.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <p className="text-sm text-slate-400">Verifier signer</p>
                            <p className="mt-3 text-xl font-semibold text-white">
                                {verifierAddress ? formatAddress(verifierAddress) : 'Syncing...'}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                Backend signs withdrawal authorization after note validation.
                            </p>
                        </div>
                    </div>

                    {error ? (
                        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                            {error}
                        </div>
                    ) : null}
                </div>

                <PrivacyScoreCard score={privacyScore} />
            </section>

            <section className="mt-8">
                <RecentTransactions loading={loading} transactions={transactions} />
            </section>
        </div>
    );
}
