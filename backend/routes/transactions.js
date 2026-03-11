const express = require('express');
const {
    deriveHashes,
    FIXED_DEPOSIT_AMOUNT_ETH,
    generateCommitmentBundle,
    getVerifierAddress,
    signWithdrawalAuthorization,
} = require('../proof-engine/zkProof');
const {
    getActivities,
    getNoteByCommitment,
    saveNote,
    updateNoteByCommitment,
} = require('../transaction-service/store');

const router = express.Router();
const addressPattern = /^0x[a-fA-F0-9]{40}$/;

router.post('/generate-commitment', (req, res) => {
    const bundle = generateCommitmentBundle();
    const now = new Date().toISOString();

    saveNote({
        commitmentHash: bundle.commitmentHash,
        nullifierHash: bundle.nullifierHash,
        secret: bundle.secret,
        nullifier: bundle.nullifier,
        createdAt: now,
        noteStatus: 'generated',
        depositStatus: 'pending',
        withdrawStatus: 'pending',
        fixedDepositAmountEth: FIXED_DEPOSIT_AMOUNT_ETH,
    });

    return res.status(201).json({
        ...bundle,
        verifierAddress: getVerifierAddress(),
        timestamp: now,
    });
});

router.post('/record-deposit', (req, res) => {
    const {
        commitmentHash,
        senderAddress,
        depositTxHash,
        contractAddress,
        chainId = '11155111',
        network = 'sepolia',
    } = req.body;

    if (!commitmentHash || !senderAddress || !depositTxHash || !contractAddress) {
        return res.status(400).json({
            error: 'commitmentHash, senderAddress, depositTxHash, and contractAddress are required',
        });
    }

    if (!addressPattern.test(senderAddress) || !addressPattern.test(contractAddress)) {
        return res.status(400).json({
            error: 'senderAddress and contractAddress must be valid addresses',
        });
    }

    const existingNote = getNoteByCommitment(commitmentHash);

    if (!existingNote) {
        return res.status(404).json({ error: 'Commitment not found' });
    }

    const updatedNote = updateNoteByCommitment(commitmentHash, {
        sender: senderAddress,
        depositTxHash,
        contractAddress,
        chainId,
        network,
        noteStatus: 'deposited',
        depositStatus: 'verified',
        depositedAt: new Date().toISOString(),
    });

    return res.json({
        success: true,
        commitmentHash: updatedNote.commitmentHash,
        depositTxHash: updatedNote.depositTxHash,
        status: updatedNote.depositStatus,
    });
});

router.post('/withdraw', async (req, res) => {
    const {
        secret,
        nullifier,
        receiverAddress,
        contractAddress,
        chainId = '11155111',
    } = req.body;

    if (!secret || !nullifier || !receiverAddress || !contractAddress) {
        return res.status(400).json({
            error: 'secret, nullifier, receiverAddress, and contractAddress are required',
        });
    }

    if (!addressPattern.test(receiverAddress) || !addressPattern.test(contractAddress)) {
        return res.status(400).json({
            error: 'receiverAddress and contractAddress must be valid addresses',
        });
    }

    const { commitmentHash, nullifierHash } = deriveHashes(secret, nullifier);
    const existingNote = getNoteByCommitment(commitmentHash);

    if (!existingNote) {
        return res.status(404).json({ error: 'Note not found for secret/nullifier pair' });
    }

    if (existingNote.nullifierHash !== nullifierHash) {
        return res.status(400).json({ error: 'Nullifier does not match stored note' });
    }

    if (existingNote.noteStatus !== 'deposited') {
        return res.status(400).json({ error: 'Commitment has not been deposited yet' });
    }

    if (existingNote.withdrawTxHash || existingNote.noteStatus === 'withdrawn') {
        return res.status(400).json({ error: 'Note has already been withdrawn' });
    }

    const proof = await signWithdrawalAuthorization({
        nullifierHash,
        receiverAddress,
        contractAddress,
        chainId,
    });

    return res.json({
        commitmentHash,
        nullifierHash,
        fixedDepositAmountEth: FIXED_DEPOSIT_AMOUNT_ETH,
        ...proof,
    });
});

router.post('/record-withdrawal', (req, res) => {
    const {
        commitmentHash,
        receiverAddress,
        withdrawTxHash,
        contractAddress,
        chainId = '11155111',
        network = 'sepolia',
    } = req.body;

    if (!commitmentHash || !receiverAddress || !withdrawTxHash || !contractAddress) {
        return res.status(400).json({
            error: 'commitmentHash, receiverAddress, withdrawTxHash, and contractAddress are required',
        });
    }

    if (!addressPattern.test(receiverAddress) || !addressPattern.test(contractAddress)) {
        return res.status(400).json({
            error: 'receiverAddress and contractAddress must be valid addresses',
        });
    }

    const existingNote = getNoteByCommitment(commitmentHash);

    if (!existingNote) {
        return res.status(404).json({ error: 'Commitment not found' });
    }

    const updatedNote = updateNoteByCommitment(commitmentHash, {
        receiver: receiverAddress,
        withdrawTxHash,
        contractAddress,
        chainId,
        network,
        noteStatus: 'withdrawn',
        withdrawStatus: 'verified',
        withdrawnAt: new Date().toISOString(),
    });

    return res.json({
        success: true,
        commitmentHash: updatedNote.commitmentHash,
        withdrawTxHash: updatedNote.withdrawTxHash,
        status: updatedNote.withdrawStatus,
    });
});

router.get('/transactions', (req, res) => {
    const address = typeof req.query.address === 'string' ? req.query.address : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const limit = typeof req.query.limit === 'string'
        ? Number.parseInt(req.query.limit, 10)
        : undefined;

    const transactions = getActivities({
        address,
        status,
        limit: Number.isFinite(limit) ? limit : undefined,
    }).map((activity) => {
        const normalizedAddress = address?.toLowerCase();
        let direction = 'shielded';

        if (normalizedAddress) {
            if (activity.receiver?.toLowerCase() === normalizedAddress) {
                direction = 'received';
            } else if (activity.sender?.toLowerCase() === normalizedAddress) {
                direction = 'sent';
            }
        }

        return {
            ...activity,
            direction,
        };
    });

    return res.json({
        transactions,
        fixedDepositAmountEth: FIXED_DEPOSIT_AMOUNT_ETH,
        verifierAddress: getVerifierAddress(),
        count: transactions.length,
    });
});

module.exports = router;
