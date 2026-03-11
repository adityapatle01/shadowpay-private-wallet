'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function PrivacyScoreCard({ score }: { score: number }) {
    return (
        <aside className="glass-card overflow-hidden p-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Privacy telemetry</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">Transaction Privacy Level</h2>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-3 text-fuchsia-200">
                    <Lock className="h-6 w-6" />
                </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-950/40 p-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-400">Current score</p>
                        <p className="mt-2 text-5xl font-semibold text-white">{score}%</p>
                    </div>
                    <div className="badge-verified">Shielded</div>
                </div>

                <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                        animate={{ width: `${score}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400"
                        initial={{ width: 0 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                </div>

                <div className="mt-6 grid gap-3">
                    {[
                        'Deposits commit a note without exposing the receiver.',
                        'Withdrawals reveal only a receiver and a spent nullifier.',
                        'Amounts stay fixed and confidential in the wallet UI.',
                    ].map((item) => (
                        <div
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                            key={item}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
