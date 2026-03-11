const fs = require('fs');
const path = require('path');
const solc = require('solc');

const rootDir = path.join(__dirname, '..');
const contractPath = path.join(rootDir, 'ShadowPayPool.sol');
const artifactsDir = path.join(rootDir, 'artifacts');
const artifactPath = path.join(artifactsDir, 'ShadowPayPool.json');

function compileContract() {
    const source = fs.readFileSync(contractPath, 'utf8');
    const input = {
        language: 'Solidity',
        sources: {
            'ShadowPayPool.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode.object'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const errors = output.errors || [];
    const fatalErrors = errors.filter((error) => error.severity === 'error');

    if (fatalErrors.length) {
        fatalErrors.forEach((error) => console.error(error.formattedMessage));
        process.exit(1);
    }

    const contract = output.contracts['ShadowPayPool.sol']?.ShadowPayPool;

    if (!contract) {
        throw new Error('ShadowPayPool contract output was not generated.');
    }

    fs.mkdirSync(artifactsDir, { recursive: true });
    fs.writeFileSync(
        artifactPath,
        JSON.stringify(
            {
                contractName: 'ShadowPayPool',
                abi: contract.abi,
                bytecode: `0x${contract.evm.bytecode.object}`,
            },
            null,
            2
        )
    );

    console.log(`Compiled ShadowPayPool to ${artifactPath}`);
}

compileContract();
