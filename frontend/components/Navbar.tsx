'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, Ghost, History, LayoutDashboard } from 'lucide-react';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
    { href: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
    { href: '/history', label: 'History', icon: History },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-10">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    <Link className="flex items-center gap-3" href="/">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200">
                            <Ghost className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold tracking-[0.2em] text-white">SHADOWPAY</p>
                            <p className="text-xs text-slate-400">Private payment wallet prototype</p>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1 md:flex">
                        {navItems.map((item) => {
                            const active = pathname === item.href;

                            return (
                                <Link
                                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                                        active
                                            ? 'nav-active'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                    href={item.href}
                                    key={item.href}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200 lg:block">
                        Privacy pool demo
                    </div>
                    <ConnectWalletButton />
                </div>

                <nav className="flex w-full items-center gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1 md:hidden">
                    {navItems.map((item) => {
                        const active = pathname === item.href;

                        return (
                            <Link
                                className={`flex min-w-max items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                                    active
                                        ? 'nav-active'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                                href={item.href}
                                key={item.href}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
