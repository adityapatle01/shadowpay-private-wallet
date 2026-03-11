const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rootDir = path.join(__dirname, '..');
const artifactPath = path.join(rootDir, 'artifacts', 'ShadowPayPool.json');
const deploymentsDir = path.join(rootDir, 'deployments');
const deploymentPath = path.join(deploymentsDir, 'sepolia.json');
const fixedDepositAmount = ethers.parseEther(
    process.env.SHADOWPAY_POOL_DEPOSIT_AMOUNT_ETH || '0.01'
);

function loadArtifact() {
    if (!fs.existsSync(artifactPath)) {
        throw new Error('Artifact missing. Run `npm run compile` inside contracts first.');
    }

    return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

async function main() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
    const verifierKey = process.env.POOL_VERIFIER_PRIVATE_KEY || privateKey;

    if (!rpcUrl || !privateKey || !verifierKey) {
        throw new Error(
            'SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY, and POOL_VERIFIER_PRIVATE_KEY are required in contracts/.env'
        );
    }

    const artifact = loadArtifact();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`, provider);
    const verifierWallet = new ethers.Wallet(
        verifierKey.startsWith('0x') ? verifierKey : `0x${verifierKey}`
    );
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    console.log('Deploying ShadowPayPool to Sepolia...');
    const contract = await factory.deploy(verifierWallet.address, fixedDepositAmount);
    await contract.waitForDeployment();

    const deployment = {
        network: 'sepolia',
        chainId: 11155111,
        contractAddress: await contract.getAddress(),
        deployer: wallet.address,
        verifier: verifierWallet.address,
        depositAmountEth: ethers.formatEther(fixedDepositAmount),
        deployedAt: new Date().toISOString(),
        transactionHash: contract.deploymentTransaction()?.hash || null,
    };

    fs.mkdirSync(deploymentsDir, { recursive: true });
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

    console.log('ShadowPayPool deployed:');
    console.log(JSON.stringify(deployment, null, 2));
    console.log('');
    console.log(`Set NEXT_PUBLIC_SHADOWPAY_CONTRACT_ADDRESS=${deployment.contractAddress} in frontend/.env.local`);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
