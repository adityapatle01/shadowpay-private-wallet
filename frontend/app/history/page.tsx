'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, ShieldAlert, ShieldCheck } from 'lucide-react';
import TransactionHistoryTable from '@/components/transactions/TransactionHistoryTable';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import { useWallet } from '@/context/WalletContext';
import { fetchTransactions } from '@/lib/api';
import type { PrivateTransaction, TransactionStatus } from '@/lib/types';

const filters: Array<{ label: string; value: 'all' | TransactionStatus; icon: typeof Activity }> = [
    { label: 'All', value: 'all', icon: Activity },
    { label: 'Pending', value: 'pending', icon: Clock3 },
    { label: 'Verified', value: 'verified', icon: ShieldCheck },
    { label: 'Failed', value: 'failed', icon: ShieldAlert },
];

export default function HistoryPage() {
    const { address, hasMetaMask, isConnected, isReady } = useWallet();
    const [filter, setFilter] = useState<'all' | TransactionStatus>('all');
    const [transactions, setTransactions] = useState<PrivateTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadTransactions() {
            if (!isReady) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetchTransactions({ address: address || undefined });

                if (active) {
                    setTransactions(response.transactions);
                }
            } catch (err) {
                if (active) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadTransactions();

        return () => {
            active = false;
        };
    }, [address, isReady]);

    const filteredTransactions = useMemo(() => {
        if (filter === 'all') {
            return transactions;
        }

        return transactions.filter((transaction) => transaction.status === filter);
    }, [filter, transactions]);

    if (!isReady) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-3xl p-8">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">History</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white">Loading wallet state</h1>
                </section>
            </div>
        );
    }

    if (!hasMetaMask) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-3xl p-8">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">History</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white">Private transaction history</h1>
                    <p className="mt-4 text-base leading-8 text-slate-300">
                        Install MetaMask to use ShadowPay.
                    </p>
                </section>
            </div>
        );
    }

    return (
        <div className="section-shell pt-12">
            <section className="glass-card p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.26em] text-slate-400">History</p>
                        <h1 className="mt-3 text-4xl font-semibold text-white">Privacy-pool history</h1>
                        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                            Review fixed-denomination deposits and withdrawals without exposing payment
                            amounts in the app UI. Each row shows a transaction ID, verification state,
                            timestamp, and privacy indicator.
                        </p>
                    </div>
                    {isConnected ? (
                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                            Connected wallet history
                        </div>
                    ) : (
                        <ConnectWalletButton />
                    )}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    {filters.map((item) => (
                        <button
                            className={`rounded-full border px-4 py-2 text-sm transition ${
                                filter === item.value
                                    ? 'border-fuchsia-400/40 bg-fuchsia-500/15 text-white'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-fuchsia-400/20 hover:bg-white/10'
                            }`}
                            key={item.value}
                            onClick={() => setFilter(item.value)}
                            type="button"
                        >
                            <span className="inline-flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>

                {error ? (
                    <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {error}
                    </div>
                ) : null}

                <div className="mt-8">
                    <TransactionHistoryTable loading={loading} transactions={filteredTransactions} />
                </div>
            </section>
        </div>
    );
}
