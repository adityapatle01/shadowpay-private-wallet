const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rootDir = path.join(__dirname, '..');
const deploymentPath = path.join(rootDir, 'deployments', 'sepolia.json');
const artifactPath = path.join(rootDir, 'artifacts', 'ShadowPayPool.json');
const apiBaseUrl = process.env.SHADOWPAY_API_URL || 'http://127.0.0.1:3001/api';

async function requestJson(url, init = {}) {
    const response = await fetch(url, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.error || `Request failed: ${response.status}`);
    }

    return payload;
}

async function main() {
    if (!fs.existsSync(deploymentPath)) {
        throw new Error('Missing deployments/sepolia.json. Deploy the contract first.');
    }

    if (!fs.existsSync(artifactPath)) {
        throw new Error('Missing artifacts/ShadowPayPool.json. Compile the contract first.');
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        throw new Error('SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY are required in contracts/.env');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(
        privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
        provider
    );
    const receiver = process.env.SHADOWPAY_TEST_RECEIVER || signer.address;
    const contract = new ethers.Contract(deployment.contractAddress, artifact.abi, signer);

    const bundle = await requestJson(`${apiBaseUrl}/generate-commitment`, {
        method: 'POST',
        body: JSON.stringify({}),
    });

    const depositTx = await contract.deposit(bundle.commitmentHash, {
        value: ethers.parseEther(bundle.fixedDepositAmountEth),
    });
    const depositReceipt = await depositTx.wait();

    await requestJson(`${apiBaseUrl}/record-deposit`, {
        method: 'POST',
        body: JSON.stringify({
            commitmentHash: bundle.commitmentHash,
            senderAddress: signer.address,
            depositTxHash: depositReceipt.hash,
            contractAddress: deployment.contractAddress,
            chainId: String(deployment.chainId),
            network: deployment.network,
        }),
    });

    const withdrawal = await requestJson(`${apiBaseUrl}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({
            secret: bundle.secret,
            nullifier: bundle.nullifier,
            receiverAddress: receiver,
            contractAddress: deployment.contractAddress,
            chainId: String(deployment.chainId),
        }),
    });

    const withdrawTx = await contract.withdraw(
        withdrawal.nullifierHash,
        receiver,
        withdrawal.signature
    );
    const withdrawReceipt = await withdrawTx.wait();

    await requestJson(`${apiBaseUrl}/record-withdrawal`, {
        method: 'POST',
        body: JSON.stringify({
            commitmentHash: withdrawal.commitmentHash,
            receiverAddress: receiver,
            withdrawTxHash: withdrawReceipt.hash,
            contractAddress: deployment.contractAddress,
            chainId: String(deployment.chainId),
            network: deployment.network,
        }),
    });

    const transactions = await requestJson(
        `${apiBaseUrl}/transactions?address=${encodeURIComponent(signer.address)}`
    );

    console.log(
        JSON.stringify(
            {
                contractAddress: deployment.contractAddress,
                receiver,
                depositTxHash: depositReceipt.hash,
                withdrawTxHash: withdrawReceipt.hash,
                commitmentHash: bundle.commitmentHash,
                nullifierHash: withdrawal.nullifierHash,
                activityCount: transactions.count,
            },
            null,
            2
        )
    );
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
