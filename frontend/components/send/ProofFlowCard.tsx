'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, LockKeyhole, Sparkles, XCircle } from 'lucide-react';
import type { ProofStep } from '@/lib/types';

interface ProofFlowCardProps {
    steps: ProofStep[];
    submitting: boolean;
    transactionId: string | null;
    proofHash: string | null;
}

function StepIcon({ status }: { status: ProofStep['status'] }) {
    if (status === 'complete') {
        return <CheckCircle2 className="h-5 w-5 text-emerald-300" />;
    }

    if (status === 'active') {
        return <Loader2 className="h-5 w-5 animate-spin text-fuchsia-300" />;
    }

    if (status === 'error') {
        return <XCircle className="h-5 w-5 text-rose-300" />;
    }

    return <Sparkles className="h-5 w-5 text-slate-500" />;
}

export default function ProofFlowCard({
    proofHash,
    steps,
    submitting,
    transactionId,
}: ProofFlowCardProps) {
    return (
        <section className="glass-card p-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Proof flow</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">Private transaction pipeline</h2>
                </div>
                <div className="proof-ring flex h-14 w-14 items-center justify-center">
                    <LockKeyhole className="h-6 w-6 text-fuchsia-200" />
                </div>
            </div>

            <div className="mt-8 space-y-4">
                {steps.map((step, index) => (
                    <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-3xl border p-5 ${
                            step.status === 'active'
                                ? 'border-fuchsia-400/30 bg-fuchsia-500/10'
                                : 'border-white/10 bg-white/[0.03]'
                        }`}
                        initial={{ opacity: 0, y: 12 }}
                        key={step.key}
                        transition={{ delay: index * 0.08 }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40">
                                <StepIcon status={step.status} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                        Step {index + 1}
                                    </p>
                                    {step.status === 'active' ? (
                                        <span className="badge-pending">In progress</span>
                                    ) : null}
                                </div>
                                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-slate-300">{step.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-400">Simulation state</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                            {submitting ? 'Running secure proof flow...' : 'Waiting for the next transaction'}
                        </p>
                    </div>
                    {transactionId ? <span className="badge-verified">Tx created</span> : null}
                </div>

                {transactionId || proofHash ? (
                    <div className="mt-5 grid gap-3 text-xs text-slate-300">
                        {transactionId ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                Transaction ID: {transactionId}
                            </div>
                        ) : null}
                        {proofHash ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                Shielded artifact: {proofHash}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
