const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../transactions.json');

function initStore() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ notes: [] }, null, 2));
    }
}

function readStore() {
    initStore();
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

    if (Array.isArray(parsed.notes)) {
        return parsed;
    }

    return { notes: [] };
}

function writeStore(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function saveNote(note) {
    const store = readStore();
    const existingIndex = store.notes.findIndex(
        (existingNote) => existingNote.commitmentHash === note.commitmentHash
    );

    if (existingIndex !== -1) {
        store.notes[existingIndex] = {
            ...store.notes[existingIndex],
            ...note,
        };
        writeStore(store);
        return store.notes[existingIndex];
    }

    store.notes.unshift(note);
    writeStore(store);
    return note;
}

function getNotes() {
    return readStore().notes;
}

function getNoteByCommitment(commitmentHash) {
    return getNotes().find((note) => note.commitmentHash === commitmentHash) || null;
}

function updateNoteByCommitment(commitmentHash, updates) {
    const store = readStore();
    const index = store.notes.findIndex((note) => note.commitmentHash === commitmentHash);

    if (index === -1) {
        return null;
    }

    store.notes[index] = {
        ...store.notes[index],
        ...updates,
    };

    writeStore(store);
    return store.notes[index];
}

function toActivity(note) {
    const activities = [];

    if (note.depositTxHash) {
        activities.push({
            transactionId: `dep-${note.commitmentHash.slice(2, 12)}`,
            action: 'deposit',
            sender: note.sender || null,
            receiver: note.contractAddress || 'Pool',
            commitmentHash: note.commitmentHash,
            proofHash: note.commitmentHash,
            status: note.depositStatus || 'verified',
            timestamp: note.depositedAt || note.createdAt,
            privacyIndicator: 98,
            hiddenAmount: 'Confidential',
            memo: null,
            network: note.network || 'sepolia',
            chainId: note.chainId || '11155111',
            contractAddress: note.contractAddress || null,
            txHash: note.depositTxHash,
        });
    }

    if (note.withdrawTxHash) {
        activities.push({
            transactionId: `wd-${note.nullifierHash.slice(2, 12)}`,
            action: 'withdrawal',
            sender: note.contractAddress || 'Pool',
            receiver: note.receiver || null,
            commitmentHash: note.commitmentHash,
            proofHash: note.nullifierHash,
            status: note.withdrawStatus || 'verified',
            timestamp: note.withdrawnAt,
            privacyIndicator: 99,
            hiddenAmount: 'Confidential',
            memo: null,
            network: note.network || 'sepolia',
            chainId: note.chainId || '11155111',
            contractAddress: note.contractAddress || null,
            txHash: note.withdrawTxHash,
        });
    }

    return activities;
}

function getActivities({ address, status, limit } = {}) {
    const normalizedAddress = address?.toLowerCase();

    const activities = getNotes()
        .flatMap((note) => toActivity(note))
        .filter((activity) => {
            const matchesAddress = !normalizedAddress
                || activity.sender?.toLowerCase() === normalizedAddress
                || activity.receiver?.toLowerCase() === normalizedAddress;
            const matchesStatus = !status || activity.status === status;
            return matchesAddress && matchesStatus;
        })
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

    if (!limit) {
        return activities;
    }

    return activities.slice(0, limit);
}

module.exports = {
    getActivities,
    getNoteByCommitment,
    getNotes,
    saveNote,
    updateNoteByCommitment,
};
