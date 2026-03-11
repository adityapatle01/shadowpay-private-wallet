const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const FIXED_DEPOSIT_AMOUNT_ETH = process.env.SHADOWPAY_POOL_DEPOSIT_AMOUNT_ETH || '0.01';
const verifierKey = process.env.POOL_VERIFIER_PRIVATE_KEY;
const verifierWallet = verifierKey
    ? new ethers.Wallet(verifierKey.startsWith('0x') ? verifierKey : `0x${verifierKey}`)
    : null;

function sha256Hex(payload) {
    return `0x${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

function randomHex(bytes = 32) {
    return `0x${crypto.randomBytes(bytes).toString('hex')}`;
}

function generateCommitmentBundle() {
    const secret = randomHex(32);
    const nullifier = randomHex(32);
    const commitmentHash = sha256Hex(`${secret}:${nullifier}`);
    const nullifierHash = sha256Hex(nullifier);

    return {
        secret,
        nullifier,
        commitmentHash,
        nullifierHash,
        note: JSON.stringify({ secret, nullifier }),
        fixedDepositAmountEth: FIXED_DEPOSIT_AMOUNT_ETH,
    };
}

function deriveHashes(secret, nullifier) {
    return {
        commitmentHash: sha256Hex(`${secret}:${nullifier}`),
        nullifierHash: sha256Hex(nullifier),
    };
}

function getWithdrawalMessage({ nullifierHash, receiverAddress, contractAddress, chainId }) {
    return ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'bytes32', 'address'],
        [BigInt(chainId), contractAddress, nullifierHash, receiverAddress]
    );
}

async function signWithdrawalAuthorization({
    nullifierHash,
    receiverAddress,
    contractAddress,
    chainId,
}) {
    if (!verifierWallet) {
        throw new Error('POOL_VERIFIER_PRIVATE_KEY is required in backend/.env');
    }

    const message = getWithdrawalMessage({
        nullifierHash,
        receiverAddress,
        contractAddress,
        chainId,
    });

    return {
        signature: await verifierWallet.signMessage(ethers.getBytes(message)),
        message,
        verifierAddress: verifierWallet.address,
    };
}

function getVerifierAddress() {
    return verifierWallet ? verifierWallet.address : null;
}

module.exports = {
    deriveHashes,
    FIXED_DEPOSIT_AMOUNT_ETH,
    generateCommitmentBundle,
    getVerifierAddress,
    signWithdrawalAuthorization,
};
