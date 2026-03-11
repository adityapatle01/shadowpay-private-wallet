import Link from 'next/link';
import {
    ArrowRight,
    EyeOff,
    LockKeyhole,
    Radar,
    ShieldCheck,
    WalletCards,
} from 'lucide-react';

const features = [
    {
        icon: EyeOff,
        title: 'Privacy-first blockchain payments',
        copy: 'ShadowPay wraps Sepolia settlement in a privacy-pool experience so deposits and withdrawals can happen without a direct sender-to-receiver link on-chain.',
    },
    {
        icon: Radar,
        title: 'Public blockchains expose financial data',
        copy: 'Standard transfers reveal sender, receiver, amount, and transaction graph relationships. That transparency is useful for verification, but poor for personal payment privacy.',
    },
    {
        icon: LockKeyhole,
        title: 'ShadowPay introduces a privacy layer',
        copy: 'A fixed-denomination pool stores only commitments on deposit, then later spends a nullifier to release ETH to a receiver without revealing which deposit funded it.',
    },
];

const pillars = [
    'Wallet-authenticated dashboard with MetaMask connection state.',
    'Commitment and nullifier generation for pool deposits and withdrawals.',
    'Confidential transaction presentation designed like a modern Web3 wallet.',
];

export default function HomePage() {
    return (
        <div className="section-shell pt-16 sm:pt-20">
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] px-6 py-12 shadow-2xl shadow-fuchsia-950/20 backdrop-blur-2xl sm:px-10 sm:py-16">
                <div
                    aria-hidden="true"
                    className="hero-orb left-[-10%] top-[-15%] h-64 w-64 bg-fuchsia-500/40"
                />
                <div
                    aria-hidden="true"
                    className="hero-orb bottom-[-20%] right-[-5%] h-72 w-72 bg-sky-500/30"
                />

                <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-200">
                            <ShieldCheck className="h-4 w-4" />
                            ShadowPay Privacy Layer
                        </div>

                        <div className="space-y-5">
                            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                                Private Payments for the Public Blockchain
                            </p>
                            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                                Private Payments for the Public Blockchain
                            </h1>
                            <p className="max-w-2xl text-lg leading-8 text-slate-300">
                                ShadowPay demonstrates how a privacy-first wallet can use a note-based
                                pool on a transparent chain to move ETH while keeping the deposit and
                                withdrawal unlinkable inside a hackathon-friendly proof simulation.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <Link className="btn-primary inline-flex items-center gap-2" href="/dashboard">
                                Launch App
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                                Proof verification is simulated, but Sepolia ETH moves through a real pool contract.
                            </div>
                        </div>

                        <ul className="grid gap-3 sm:grid-cols-3">
                            {pillars.map((pillar) => (
                                <li
                                    className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4 text-sm text-slate-300"
                                    key={pillar}
                                >
                                    {pillar}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="glass-card glow-purple relative overflow-hidden p-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-sky-500/10" />
                        <div className="relative space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                        Shadow Wallet
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-white">
                                        Confidential by default
                                    </h2>
                                </div>
                                <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3 text-fuchsia-200">
                                    <WalletCards className="h-7 w-7" />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                                <div className="flex items-center justify-between text-sm text-slate-400">
                                    <span>Private balance</span>
                                    <span className="badge-verified">Shielded</span>
                                </div>
                                <p className="font-mono text-4xl text-white">128.7500 SHDW</p>
                                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                    <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400" />
                                </div>
                                <p className="text-sm text-slate-400">
                                    Transaction privacy remains high because deposits publish commitments
                                    and withdrawals spend nullifiers instead of exposing a direct transfer path.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                {[
                                    'Generate a secret note and deposit commitment',
                                    'Store ETH inside the ShadowPay Sepolia pool',
                                    'Withdraw later with a nullifier and signed authorization',
                                ].map((item, index) => (
                                    <div
                                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                                        key={item}
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-500/15 text-sm font-semibold text-fuchsia-200">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm text-slate-300">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-16 grid gap-6 lg:grid-cols-3">
                {features.map((feature) => (
                    <article className="glass-card-hover p-6" key={feature.title}>
                        <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3 text-fuchsia-200">
                            <feature.icon className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{feature.copy}</p>
                    </article>
                ))}
            </section>
        </div>
    );
}
