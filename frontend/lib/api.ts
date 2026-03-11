import type {
    GenerateCommitmentResponse,
    RecordDepositResponse,
    RecordWithdrawalResponse,
    TransactionsResponse,
    WithdrawResponse,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_SHADOWPAY_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export function fetchTransactions({
    address,
    limit,
    status,
}: {
    address?: string;
    status?: string;
    limit?: number;
} = {}) {
    const params = new URLSearchParams();

    if (address) {
        params.set('address', address);
    }

    if (status) {
        params.set('status', status);
    }

    if (limit) {
        params.set('limit', String(limit));
    }

    const query = params.toString();
    return request<TransactionsResponse>(`/transactions${query ? `?${query}` : ''}`);
}

export function generateCommitment() {
    return request<GenerateCommitmentResponse>('/generate-commitment', {
        method: 'POST',
    });
}

export function recordDeposit(payload: {
    commitmentHash: string;
    senderAddress: string;
    depositTxHash: string;
    contractAddress: string;
    chainId?: string;
    network?: string;
}) {
    return request<RecordDepositResponse>('/record-deposit', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function requestWithdrawal(payload: {
    secret: string;
    nullifier: string;
    receiverAddress: string;
    contractAddress: string;
    chainId?: string;
}) {
    return request<WithdrawResponse>('/withdraw', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function recordWithdrawal(payload: {
    commitmentHash: string;
    receiverAddress: string;
    withdrawTxHash: string;
    contractAddress: string;
    chainId?: string;
    network?: string;
}) {
    return request<RecordWithdrawalResponse>('/record-withdrawal', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
