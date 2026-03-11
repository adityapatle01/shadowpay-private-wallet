export type TransactionStatus = 'pending' | 'verified' | 'failed';
export type TransactionAction = 'deposit' | 'withdrawal';

export interface PrivateTransaction {
    transactionId: string;
    action: TransactionAction;
    sender: string | null;
    receiver: string | null;
    commitmentHash: string;
    proofHash: string;
    status: TransactionStatus;
    timestamp: string;
    privacyIndicator: number;
    hiddenAmount: 'Confidential';
    direction: 'sent' | 'received' | 'shielded';
    network?: string | null;
    chainId?: string | null;
    contractAddress?: string | null;
    txHash?: string | null;
}

export interface TransactionsResponse {
    transactions: PrivateTransaction[];
    fixedDepositAmountEth: string;
    verifierAddress: string | null;
    count: number;
}

export interface GenerateCommitmentResponse {
    secret: string;
    nullifier: string;
    commitmentHash: string;
    nullifierHash: string;
    note: string;
    fixedDepositAmountEth: string;
    verifierAddress: string | null;
    timestamp: string;
}

export interface RecordDepositResponse {
    success: boolean;
    commitmentHash: string;
    depositTxHash: string;
    status: TransactionStatus;
}

export interface WithdrawResponse {
    commitmentHash: string;
    nullifierHash: string;
    fixedDepositAmountEth: string;
    signature: string;
    message: string;
    verifierAddress: string | null;
}

export interface RecordWithdrawalResponse {
    success: boolean;
    commitmentHash: string;
    withdrawTxHash: string;
    status: TransactionStatus;
}

export interface ProofStep {
    key: string;
    title: string;
    description: string;
    status: 'idle' | 'active' | 'complete' | 'error';
}

export interface StoredShadowNote {
    commitmentHash: string;
    nullifierHash: string;
    secret: string;
    nullifier: string;
    note: string;
    createdAt: string;
    depositAmountEth: string;
    senderAddress: string;
    contractAddress: string;
    chainId: string;
    depositTxHash?: string | null;
    withdrawTxHash?: string | null;
    receiverAddress?: string | null;
    status: 'deposited' | 'withdrawn';
}
