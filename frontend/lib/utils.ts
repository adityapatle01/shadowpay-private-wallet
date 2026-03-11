import type { TransactionStatus } from '@/lib/types';

export function formatAddress(address?: string | null) {
    if (!address) {
        return 'Not connected';
    }

    if (!address.startsWith('0x') || address.length < 12) {
        return address;
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: string) {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(timestamp));
}

export function formatPrivateBalance(balance: number) {
    return `${balance.toFixed(4)} ETH`;
}

export function getStatusBadgeClass(status: TransactionStatus) {
    if (status === 'verified') {
        return 'badge-verified';
    }

    if (status === 'failed') {
        return 'badge-failed';
    }

    return 'badge-pending';
}
