'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock3, ExternalLink, ShieldCheck } from 'lucide-react';
import type { PrivateTransaction } from '@/lib/types';
import { formatAddress, formatTimestamp, getStatusBadgeClass } from '@/lib/utils';
import { getSepoliaExplorerUrl } from '@/lib/shadowPay';

interface RecentTransactionsProps {
    transactions: PrivateTransaction[];
    loading: boolean;
}

function getCounterpartyLabel(transaction: PrivateTransaction) {
    if (transaction.action === 'deposit') {
        return transaction.receiver || transaction.contractAddress || 'ShadowPay Pool';
    }

    return transaction.receiver || 'Stealth receiver';
}

function getActionLabel(transaction: PrivateTransaction) {
    return transaction.action === 'deposit' ? 'Pool deposit' : 'Private withdrawal';
}

export default function RecentTransactions({
    loading,
    transactions,
}: RecentTransactionsProps) {
    return (
        <section className="glass-card p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Activity</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">Recent privacy-pool activity</h2>
                </div>
                <Link className="btn-ghost inline-flex items-center gap-2" href="/history">
                    View all history
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </div>

            {loading ? (
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                        <div className="glass-card shimmer h-40" key={item} />
                    ))}
                </div>
            ) : null}

            {!loading && transactions.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-fuchsia-200">
                        <Clock3 className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">No privacy-pool transactions yet</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                        Deposit a fixed-denomination note or withdraw one to a receiver and it will appear here.
                    </p>
                </div>
            ) : null}

            {!loading && transactions.length > 0 ? (
                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {transactions.map((transaction) => (
                        <article className="glass-card-hover p-5" key={transaction.transactionId}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                        {getActionLabel(transaction)}
                                    </p>
                                    <p className="mt-2 text-base font-semibold text-white">
                                        {formatAddress(getCounterpartyLabel(transaction))}
                                    </p>
                                </div>
                                <span className={getStatusBadgeClass(transaction.status)}>
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {transaction.status}
                                </span>
                            </div>

                            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Amount</p>
                                <p className="mt-2 amount-hidden text-xl">{transaction.hiddenAmount}</p>
                            </div>

                            <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                                <span>{formatTimestamp(transaction.timestamp)}</span>
                                <span>{transaction.privacyIndicator}% privacy</span>
                            </div>

                            {transaction.txHash ? (
                                <a
                                    className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
                                    href={getSepoliaExplorerUrl(transaction.txHash)}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    View on Sepolia
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            ) : null}
                        </article>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
