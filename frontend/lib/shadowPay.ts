import { Contract, ethers } from 'ethers';

export const SEPOLIA_CHAIN_ID = '11155111';
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';
export const SEPOLIA_NETWORK = 'Sepolia';

export const SHADOWPAY_POOL_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'verifierAddress', type: 'address' },
            { internalType: 'uint256', name: 'fixedDepositAmount', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'bytes32', name: 'commitment', type: 'bytes32' },
            { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        name: 'Deposit',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'to', type: 'address' },
            { indexed: true, internalType: 'bytes32', name: 'nullifier', type: 'bytes32' },
        ],
        name: 'Withdrawal',
        type: 'event',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'commitment', type: 'bytes32' }],
        name: 'commitments',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'depositAmount',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'commitment', type: 'bytes32' }],
        name: 'deposit',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'nullifier', type: 'bytes32' },
            { internalType: 'address', name: 'receiver', type: 'address' },
        ],
        name: 'getWithdrawalMessage',
        outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'nullifier', type: 'bytes32' }],
        name: 'nullifiers',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'verifier',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'nullifier', type: 'bytes32' },
            { internalType: 'address', name: 'receiver', type: 'address' },
            { internalType: 'bytes', name: 'signature', type: 'bytes' },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

export function getShadowPayContractAddress() {
    return process.env.NEXT_PUBLIC_SHADOWPAY_CONTRACT_ADDRESS || '';
}

export function hasShadowPayContractAddress() {
    const contractAddress = getShadowPayContractAddress();
    return Boolean(contractAddress && ethers.isAddress(contractAddress));
}

export function getShadowPayContract(signerOrProvider: ethers.ContractRunner) {
    const contractAddress = getShadowPayContractAddress();

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
        throw new Error(
            'ShadowPay Sepolia pool contract is not configured. Set NEXT_PUBLIC_SHADOWPAY_CONTRACT_ADDRESS.'
        );
    }

    return new Contract(contractAddress, SHADOWPAY_POOL_ABI, signerOrProvider);
}

export function getSepoliaExplorerUrl(value: string, type: 'tx' | 'address' = 'tx') {
    return `https://sepolia.etherscan.io/${type}/${value}`;
}
