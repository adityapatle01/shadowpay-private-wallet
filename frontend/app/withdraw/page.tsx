'use client';

import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { ArrowUpFromLine, ExternalLink, KeyRound, Wand2 } from 'lucide-react';
import ProofFlowCard from '@/components/send/ProofFlowCard';
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import { useWallet } from '@/context/WalletContext';
import { fetchTransactions, recordWithdrawal, requestWithdrawal } from '@/lib/api';
import {
    findStoredNote,
    getAvailableStoredNotes,
    markStoredNoteWithdrawn,
    parseShadowNote,
} from '@/lib/notes';
import {
    getSepoliaExplorerUrl,
    getShadowPayContract,
    getShadowPayContractAddress,
    hasShadowPayContractAddress,
    SEPOLIA_CHAIN_ID,
} from '@/lib/shadowPay';
import type { ProofStep, StoredShadowNote } from '@/lib/types';
import { formatAddress } from '@/lib/utils';

const baseSteps: ProofStep[] = [
    {
        key: 'validate',
        title: 'Validating note',
        description: 'The backend recomputes the commitment and checks that the note has not been spent.',
        status: 'idle',
    },
    {
        key: 'sign',
        title: 'Generating withdrawal authorization',
        description: 'A verifier signer produces the simulated proof payload used by the Sepolia pool contract.',
        status: 'idle',
    },
    {
        key: 'withdraw',
        title: 'Submitting pool withdrawal',
        description: 'MetaMask sends the nullifier and withdrawal authorization to the Sepolia pool.',
        status: 'idle',
    },
    {
        key: 'complete',
        title: 'Withdrawal complete',
        description: 'The note is marked as spent and ETH is transferred to the receiver address.',
        status: 'idle',
    },
];

function sleep(duration: number) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}

export default function WithdrawPage() {
    const {
        ensureSepoliaNetwork,
        hasMetaMask,
        isConnected,
        isReady,
        isSepolia,
        signer,
    } = useWallet();
    const [secret, setSecret] = useState('');
    const [nullifier, setNullifier] = useState('');
    const [receiverAddress, setReceiverAddress] = useState('');
    const [noteInput, setNoteInput] = useState('');
    const [availableNotes, setAvailableNotes] = useState<StoredShadowNote[]>([]);
    const [fixedDepositAmount, setFixedDepositAmount] = useState('0.01');
    const [steps, setSteps] = useState<ProofStep[]>(baseSteps);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [nullifierHash, setNullifierHash] = useState<string | null>(null);
    const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null);
    const [commitmentHash, setCommitmentHash] = useState<string | null>(null);

    const canSubmit = useMemo(
        () => Boolean(secret.trim() && nullifier.trim() && receiverAddress.trim() && !submitting),
        [nullifier, receiverAddress, secret, submitting]
    );

    useEffect(() => {
        let active = true;

        function refreshNotes() {
            if (!active) {
                return;
            }

            setAvailableNotes(getAvailableStoredNotes());
        }

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

        refreshNotes();
        void loadConfig();
        window.addEventListener('focus', refreshNotes);
        window.addEventListener('storage', refreshNotes);

        return () => {
            active = false;
            window.removeEventListener('focus', refreshNotes);
            window.removeEventListener('storage', refreshNotes);
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
        setNullifierHash(null);
        setWithdrawTxHash(null);
        setCommitmentHash(null);
    }

    function handlePasteNote() {
        const parsed = parseShadowNote(noteInput);

        if (!parsed) {
            setError('The note must be valid JSON with secret and nullifier fields.');
            return;
        }

        setSecret(parsed.secret);
        setNullifier(parsed.nullifier);
        setError(null);
    }

    async function handleWithdraw() {
        resetFlow();
        setSubmitting(true);

        try {
            if (!signer) {
                throw new Error('Wallet signer is unavailable. Reconnect MetaMask and try again.');
            }

            if (!hasShadowPayContractAddress()) {
                throw new Error(
                    'ShadowPay pool contract is not configured. Set NEXT_PUBLIC_SHADOWPAY_CONTRACT_ADDRESS.'
                );
            }

            if (!ethers.isAddress(receiverAddress)) {
                throw new Error('Enter a valid receiver wallet address.');
            }

            const onSepolia = isSepolia || (await ensureSepoliaNetwork());

            if (!onSepolia) {
                throw new Error('Switch MetaMask to Sepolia before withdrawing a note.');
            }

            setStepStatus('validate', 'active');
            await sleep(400);
            const withdrawal = await requestWithdrawal({
                secret,
                nullifier,
                receiverAddress,
                contractAddress: getShadowPayContractAddress(),
                chainId: SEPOLIA_CHAIN_ID,
            });
            setCommitmentHash(withdrawal.commitmentHash);
            setNullifierHash(withdrawal.nullifierHash);
            setStepStatus('validate', 'complete');

            setStepStatus('sign', 'active');
            await sleep(250);
            setStepStatus('sign', 'complete');

            setStepStatus('withdraw', 'active');
            const contract = getShadowPayContract(signer);
            const withdrawTx = await contract.withdraw(
                withdrawal.nullifierHash,
                receiverAddress,
                withdrawal.signature
            );
            const receipt = await withdrawTx.wait();

            if (!receipt) {
                throw new Error('Sepolia withdrawal transaction did not return a receipt.');
            }

            setWithdrawTxHash(receipt.hash);
            setStepStatus('withdraw', 'complete');

            setStepStatus('complete', 'active');
            await recordWithdrawal({
                commitmentHash: withdrawal.commitmentHash,
                receiverAddress,
                withdrawTxHash: receipt.hash,
                contractAddress: getShadowPayContractAddress(),
                chainId: SEPOLIA_CHAIN_ID,
                network: 'sepolia',
            });

            const localNote = findStoredNote(secret, nullifier);

            if (localNote) {
                markStoredNoteWithdrawn(localNote.commitmentHash, {
                    receiverAddress,
                    withdrawTxHash: receipt.hash,
                });
            }

            setAvailableNotes(getAvailableStoredNotes());
            setStepStatus('complete', 'complete');
            setSuccess('Private withdrawal verified. ETH has been transferred to the receiver address.');
            setNoteInput('');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to withdraw note';
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

    if (!isReady) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-3xl p-8">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Withdraw</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white">Loading wallet state</h1>
                </section>
            </div>
        );
    }

    if (!hasMetaMask) {
        return (
            <div className="section-shell pt-16">
                <section className="glass-card max-w-3xl p-8">
                    <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Withdraw</p>
                    <h1 className="mt-3 text-3xl font-semibold text-white">Withdraw a private note</h1>
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
                    <h1 className="text-4xl font-semibold text-white">Connect your wallet to withdraw</h1>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                        Withdrawals spend a note with a nullifier and send the fixed ETH amount to a receiver you choose.
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
                            <p className="text-sm uppercase tracking-[0.26em] text-slate-400">Pool withdrawal</p>
                            <h1 className="mt-3 text-4xl font-semibold text-white">Withdraw {fixedDepositAmount} ETH</h1>
                            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                                Spend a funded ShadowPay note and route the fixed pool amount to a fresh receiver address.
                            </p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                            Use a fresh receiver for better privacy
                        </div>
                    </div>

                    <div className="mt-8 space-y-5">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-300">
                                Stored note JSON
                            </span>
                            <textarea
                                className="h-28 w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/40 focus:bg-slate-950/80"
                                onChange={(event) => setNoteInput(event.target.value)}
                                placeholder='{"secret":"0x...","nullifier":"0x..."}'
                                value={noteInput}
                            />
                            <button
                                className="btn-secondary mt-3 inline-flex items-center gap-2"
                                onClick={handlePasteNote}
                                type="button"
                            >
                                <Wand2 className="h-4 w-4" />
                                Parse note
                            </button>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-300">Secret</span>
                            <input
                                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/40 focus:bg-slate-950/80"
                                onChange={(event) => setSecret(event.target.value)}
                                placeholder="0x..."
                                value={secret}
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-300">Nullifier</span>
                            <input
                                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/40 focus:bg-slate-950/80"
                                onChange={(event) => setNullifier(event.target.value)}
                                placeholder="0x..."
                                value={nullifier}
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-300">Receiver wallet address</span>
                            <input
                                className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-400/40 focus:bg-slate-950/80"
                                onChange={(event) => setReceiverAddress(event.target.value)}
                                placeholder="0x..."
                                value={receiverAddress}
                            />
                        </label>

                        <button
                            className="btn-primary inline-flex w-full items-center justify-center gap-2"
                            disabled={!canSubmit}
                            onClick={() => {
                                void handleWithdraw();
                            }}
                            type="button"
                        >
                            Generate Private Withdrawal
                            <ArrowUpFromLine className="h-4 w-4" />
                        </button>
                    </div>

                    {availableNotes.length ? (
                        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                            <div className="flex items-center gap-3 text-slate-300">
                                <KeyRound className="h-5 w-5 text-cyan-300" />
                                <h2 className="text-lg font-semibold text-white">Local unspent notes</h2>
                            </div>
                            <div className="mt-4 space-y-3">
                                {availableNotes.slice(0, 3).map((storedNote) => (
                                    <div
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                                        key={storedNote.commitmentHash}
                                    >
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                                                Commitment
                                            </p>
                                            <p className="mt-1 font-mono text-xs text-slate-200">
                                                {storedNote.commitmentHash}
                                            </p>
                                        </div>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => {
                                                setSecret(storedNote.secret);
                                                setNullifier(storedNote.nullifier);
                                                setNoteInput(storedNote.note);
                                            }}
                                            type="button"
                                        >
                                            Use note
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

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

                    {withdrawTxHash ? (
                        <div className="mt-6 space-y-3">
                            <p className="text-sm text-slate-300">
                                Receiver: <span className="font-medium text-white">{formatAddress(receiverAddress)}</span>
                            </p>
                            <a
                                className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-white"
                                href={getSepoliaExplorerUrl(withdrawTxHash)}
                                rel="noreferrer"
                                target="_blank"
                            >
                                View withdrawal on Sepolia
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    ) : null}
                </div>

                <ProofFlowCard
                    proofHash={nullifierHash}
                    steps={steps}
                    submitting={submitting}
                    transactionId={withdrawTxHash || commitmentHash}
                />
            </section>
        </div>
    );
}
