import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/context/WalletContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
    title: 'ShadowPay — Privacy-First Blockchain Payments',
    description:
        'ShadowPay enables confidential digital transactions on public blockchains using Zero-Knowledge Proof simulation. Send private crypto payments without revealing amounts or addresses.',
    keywords: ['privacy', 'blockchain', 'ZK proofs', 'crypto', 'private payments', 'Web3'],
    openGraph: {
        title: 'ShadowPay',
        description: 'Privacy-first blockchain payment wallet',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                <WalletProvider>
                    <div className="mesh-bg" aria-hidden="true" />
                    <div className="particle-bg" aria-hidden="true" />
                    <Navbar />
                    <main className="relative z-10 min-h-screen">
                        {children}
                    </main>
                </WalletProvider>
            </body>
        </html>
    );
}
