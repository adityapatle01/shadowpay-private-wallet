'use client';

import { ExternalLink, Shield } from 'lucide-react';
import type { PrivateTransaction } from '@/lib/types';
import { formatAddress, formatTimestamp, getStatusBadgeClass } from '@/lib/utils';
import { getSepoliaExplorerUrl } from '@/lib/shadowPay';

interface TransactionHistoryTableProps {
    transactions: PrivateTransaction[];
    loading: boolean;
}

function getCounterparty(transaction: PrivateTransaction) {
    if (transaction.action === 'deposit') {
        return transaction.receiver || transaction.contractAddress || 'ShadowPay Pool';
    }

    return transaction.receiver || 'Stealth receiver';
}

function getActionLabel(transaction: PrivateTransaction) {
    return transaction.action === 'deposit' ? 'Deposit' : 'Withdrawal';
}

export default function TransactionHistoryTable({
    loading,
    transactions,
}: TransactionHistoryTableProps) {
    if (loading) {
        return (
            <div className="grid gap-4">
                {[0, 1, 2].map((item) => (
                    <div className="glass-card shimmer h-24" key={item} />
                ))}
            </div>
        );
    }

    if (!transactions.length) {
        return (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
                <h2 className="text-xl font-semibold text-white">No transactions for this filter</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                    Once a note is deposited or withdrawn, it will appear here as a confidential record.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="hidden overflow-hidden rounded-3xl border border-white/10 xl:block">
                <table className="min-w-full divide-y divide-white/10 text-left">
                    <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.24em] text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Privacy Indicator</th>
                            <th className="px-6 py-4">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-slate-950/30">
                        {transactions.map((transaction) => (
                            <tr className="text-sm text-slate-300" key={transaction.transactionId}>
                                <td className="px-6 py-5">
                                    <div className="font-mono text-white">
                                        {transaction.transactionId.slice(0, 18)}...
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        {getActionLabel(transaction)} to {formatAddress(getCounterparty(transaction))}
                                    </div>
                                </td>
                                <td className="px-6 py-5">{formatTimestamp(transaction.timestamp)}</td>
                                <td className="px-6 py-5">
                                    <span className={getStatusBadgeClass(transaction.status)}>
                                        {transaction.status}
                                    </span>
                                    {transaction.txHash ? (
                                        <a
                                            className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-200 hover:text-white"
                                            href={getSepoliaExplorerUrl(transaction.txHash)}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            Sepolia tx
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    ) : null}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="inline-flex items-center gap-2 text-white">
                                        <Shield className="h-4 w-4 text-fuchsia-300" />
                                        {transaction.privacyIndicator}%
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="amount-hidden">{transaction.hiddenAmount}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid gap-4 xl:hidden">
                {transactions.map((transaction) => (
                    <article className="glass-card p-5" key={transaction.transactionId}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Transaction ID</p>
                                <p className="mt-2 font-mono text-sm text-white">
                                    {transaction.transactionId.slice(0, 20)}...
                                </p>
                            </div>
                            <span className={getStatusBadgeClass(transaction.status)}>{transaction.status}</span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timestamp</p>
                                <p className="mt-2 text-sm text-slate-300">{formatTimestamp(transaction.timestamp)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Privacy Indicator</p>
                                <p className="mt-2 text-sm text-white">{transaction.privacyIndicator}%</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Amount</p>
                                <p className="mt-2 amount-hidden text-lg">{transaction.hiddenAmount}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Action</p>
                                <p className="mt-2 text-sm text-slate-300">
                                    {getActionLabel(transaction)} to {formatAddress(getCounterparty(transaction))}
                                </p>
                            </div>
                            {transaction.txHash ? (
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Explorer</p>
                                    <a
                                        className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
                                        href={getSepoliaExplorerUrl(transaction.txHash)}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        View on Sepolia
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
