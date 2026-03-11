import type { StoredShadowNote } from '@/lib/types';

const STORAGE_KEY = 'shadowpay_notes';

function isBrowser() {
    return typeof window !== 'undefined';
}

export function getStoredNotes() {
    if (!isBrowser()) {
        return [] as StoredShadowNote[];
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [] as StoredShadowNote[];
        }

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [] as StoredShadowNote[];
    }
}

function saveStoredNotes(notes: StoredShadowNote[]) {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function upsertStoredNote(note: StoredShadowNote) {
    const notes = getStoredNotes();
    const index = notes.findIndex((existing) => existing.commitmentHash === note.commitmentHash);

    if (index === -1) {
        notes.unshift(note);
    } else {
        notes[index] = {
            ...notes[index],
            ...note,
        };
    }

    saveStoredNotes(notes);
}

export function markStoredNoteWithdrawn(commitmentHash: string, updates: Partial<StoredShadowNote>) {
    const notes = getStoredNotes().map((note) =>
        note.commitmentHash === commitmentHash
            ? {
                  ...note,
                  ...updates,
                  status: 'withdrawn' as const,
              }
            : note
    );

    saveStoredNotes(notes);
}

export function getAvailableStoredNotes(address?: string | null) {
    const normalizedAddress = address?.toLowerCase();

    return getStoredNotes().filter((note) => {
        const matchesAddress = !normalizedAddress || note.senderAddress.toLowerCase() === normalizedAddress;
        return matchesAddress && note.status === 'deposited';
    });
}

export function findStoredNote(secret: string, nullifier: string) {
    return getStoredNotes().find(
        (note) => note.secret.toLowerCase() === secret.toLowerCase()
            && note.nullifier.toLowerCase() === nullifier.toLowerCase()
    ) || null;
}

export function parseShadowNote(rawNote: string) {
    try {
        const parsed = JSON.parse(rawNote);

        if (typeof parsed.secret !== 'string' || typeof parsed.nullifier !== 'string') {
            return null;
        }

        return {
            secret: parsed.secret,
            nullifier: parsed.nullifier,
        };
    } catch {
        return null;
    }
}
