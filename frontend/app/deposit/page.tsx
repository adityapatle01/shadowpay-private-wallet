'use client';

import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { Check, Copy, ExternalLink, Shield } from 'lucide-react';
import ProofFlowCard from '@/components/send/ProofFlowCard';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import { useWallet } from '@/context/WalletContext';
import { fetchTransactions, generateCommitment, recordDeposit } from '@/lib/api';
import { upsertStoredNote } from '@/lib/notes';
import type { ProofStep } from '@/lib/types';
import { formatAddress } from '@/lib/utils';
import {
    getSepoliaExplorerUrl,
    getShadowPayContract,
    getShadowPayContractAddress,
    hasShadowPayContractAddress,
    SEPOLIA_CHAIN_ID,
} from '@/lib/shadowPay';

const baseSteps: ProofStep[] = [
    {
        key: 'create',
        title: 'Generating private note',
        description: 'ShadowPay creates a secret, nullifier, and commitment for the fixed pool deposit.',
        status: 'idle',
    },
    {
        key: 'deposit',
        title: 'Submitting pool deposit',
        description: 'MetaMask sends the fixed ETH amount to the Sepolia privacy pool contract.',
        status: 'idle',
    },
    {
        key: 'record',
        title: 'Recording commitment',
        description: 'The backend records the commitment and marks the note as funded.',
        status: 'idle',
    },
    {
        key: 'backup',
        title: 'Backing up withdrawal note',
        description: 'The funded note is stored locally so it can be shared or withdrawn later.',
        status: 'idle',
    },
];

function sleep(duration: number) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}

export default function DepositPage() {
    const {
        address,
        ensureSepoliaNetwork,
        hasMetaMask,
        isConnected,
        isReady,
        isSepolia,
        signer,
    } = useWallet();
    const [steps, setSteps] = useState<ProofStep[]>(baseSteps);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [fixedDepositAmount, setFixedDepositAmount] = useState('0.01');
    const [commitmentHash, setCommitmentHash] = useState<string | null>(null);
    const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
    const [note, setNote] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const canSubmit = useMemo(
        () => Boolean(!submitting && hasShadowPayContractAddress()),
        [submitting]
    );

    useEffect(() => {
        let active = true;

        async function loadConfig() {
            try {
                const response = await fetchTransactions({ limit: 1 });

                if (active && response.fixedDepositAmountEth) {
                    setFixedDepositAmount(response.fixedDepositAmountEth);
                }
            } catch {
                if (active) {
                    setFixedDepositAmount('0.01');
                }
            }
        }

        void loadConfig();

        return () => {
            active = false;
        };
    }, []);

    function setStepStatus(key: string, status: ProofStep['status']) {
        setSteps((currentSteps) =>
            currentSteps.map((step) => (step.key === key ? { ...step, status } : step))
        );
    }

    function resetFlow() {
        setSteps(baseSteps);
        setError(null);
        setSuccess(null);
        setCommitmentHash(null);
        setDepositTxHash(null);
        setNote(null);
        setCopied(false);
    }

    async function handleDeposit() {
        if (!address) {
            return;
        }

        resetFlow();
        setSubmitting(true);

        try {
            if (!signer) {
                throw new Error('Wallet signer is unavailable. Reconnect MetaMask and try again.');
            }

            const onSepolia = isSepolia || (await ensureSepoliaNetwork());

            if (!onSepolia) {
                throw new Error('Switch MetaMask to Sepolia before depositing into the pool.');
            }

            if (!hasShadowPayContractAddress()) {
                throw new Error(
                    'ShadowPay pool contract is not configured. Set NEXT_PUBLIC_SHADOWPAY_CONTRACT_ADDRESS.'
                );
            }

            setStepStatus('create', 'active');
            await sleep(500);
            const bundle = await generateCommitment();
            setCommitmentHash(bundle.commitmentHash);
            setFixedDepositAmount(bundle.fixedDepositAmountEth || fixedDepositAmount);
            setStepStatus('create', 'complete');

            setStepStatus('deposit', 'active');
            const contract = getShadowPayContract(signer);
            const depositTx = await contract.deposit(bundle.commitmentHash, {
                value: ethers.parseEther(bundle.fixedDepositAmountEth || fixedDepositAmount),
            });
            const receipt = await depositTx.wait();

            if (!receipt) {
                throw new Error('Sepolia deposit transaction did not return a receipt.');
            }

            setDepositTxHash(receipt.hash);
            setStepStatus('deposit', 'complete');

            setStepStatus('record', 'active');
            await recordDeposit({
                commitmentHash: bundle.commitmentHash,
                senderAddress: address,
                depositTxHash: receipt.hash,
                contractAddress: getShadowPayContractAddress(),
                chainId: SEPOLIA_CHAIN_ID,
                network: 'sepolia',
            });
            setStepStatus('record', 'complete');

            setStepStatus('backup', 'active');
            upsertStoredNote({
                commitmentHash: bundle.commitmentHash,
                nullifierHash: bundle.nullifierHash,
                secret: bundle.secret,
                nullifier: bundle.nullifier,
                note: bundle.note,
                createdAt: bundle.timestamp,
                depositAmountEth: bundle.fixedDepositAmountEth,
                senderAddress: address,
                contractAddress: getShadowPayContractAddress(),
                chainId: SEPOLIA_CHAIN_ID,
                depositTxHash: receipt.hash,
                status: 'deposited',
            });
            setNote(bundle.note);
            await sleep(350);
            setStepStatus('backup', 'complete');

            setSuccess('Pool deposit confirmed. Back up the note before you close this page.');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to deposit into ShadowPay Pool';
            setError(message);
            setSteps((currentSteps) =>
                currentSteps.map((step) =>
                    step.status === 'active' ? { ...step, status: 'error' } : step
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function copyNote() {
        if (!note) {
            return;
        }

        await navigator.clipboard.writeText(note);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    }

    if (!isReady) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-3xl p-8">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Deposit</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white">Loading wallet state</h1>
                </section>
            </div>
        );
    }

    if (!hasMetaMask) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-3xl p-8">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Deposit</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white">Fund a private pool note</h1>
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
                    <h1 className="text-4xl font-semibold text-white">Connect your wallet to deposit</h1>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                        A pool deposit locks a fixed ETH amount under a commitment. The receiver stays off-chain until withdrawal.
                    </p>
                    <div className="mt-6">
                        <ConnectWalletButton fullWidth />
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="section-shell pt-12">
            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="glass-card p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Pool deposit</p>
                            <h1 className="mt-3 text-4xl font-semibold text-white">Deposit {fixedDepositAmount} ETH</h1>
                            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                                Create a shielded pool note on Sepolia. The chain only sees a commitment, not the final receiver.
                            </p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                            Wallet {formatAddress(address)}
                        </div>
                    </div>

                    <div className="mt-8 space-y-5">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <div className="flex items-center gap-3 text-slate-300">
                                <Shield className="h-5 w-5 text-fuchsia-300" />
                                <h2 className="text-lg font-semibold text-white">Deposit design</h2>
                            </div>
                            <p className="mt-4 text-sm leading-7 text-slate-300">
                                Every pool note uses a fixed denomination so deposits blend together.
                                After confirmation, a secret note is stored locally and can later unlock a withdrawal.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <p className="text-sm text-slate-400">Pool contract</p>
                            <p className="mt-3 break-all font-mono text-sm text-white">
                                {hasShadowPayContractAddress()
                                    ? getShadowPayContractAddress()
                                    : 'NEXT_PUBLIC_SHADOWPAY_CONTRACT_ADDRESS is missing'}
                            </p>
                            <p className="mt-3 text-sm text-slate-400">
                                Network: {isSepolia ? 'Ethereum Sepolia' : 'Switch MetaMask to Sepolia'}
                            </p>
                        </div>

                        <button
                            className="btn-primary inline-flex w-full items-center justify-center gap-2"
                            disabled={!canSubmit}
                            onClick={() => {
                                void handleDeposit();
                            }}
                            type="button"
                        >
                            Generate Private Deposit
                        </button>
                    </div>

                    {error ? (
                        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                            {error}
                        </div>
                    ) : null}

                    {success ? (
                        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                            {success}
                        </div>
                    ) : null}

                    {note ? (
                        <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-100">Withdrawal note</p>
                                    <h2 className="mt-2 text-xl font-semibold text-white">Back this up now</h2>
                                </div>
                                <button
                                    className="btn-secondary inline-flex items-center gap-2"
                                    onClick={copyNote}
                                    type="button"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copied ? 'Copied' : 'Copy note'}
                                </button>
                            </div>
                            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-200">
                                {note}
                            </pre>
                            <p className="mt-3 text-sm text-cyan-100/90">
                                Anyone with this note can withdraw the deposited ETH. Use a fresh receiver address for better privacy.
                            </p>
                        </div>
                    ) : null}

                    {depositTxHash ? (
                        <a
                            className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
                            href={getSepoliaExplorerUrl(depositTxHash)}
                            rel="noreferrer"
                            target="_blank"
                        >
                            View deposit on Sepolia
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    ) : null}
                </div>

                <ProofFlowCard
                    proofHash={commitmentHash}
                    steps={steps}
                    submitting={submitting}
                    transactionId={depositTxHash}
                />
            </section>
        </div>
    );
}
