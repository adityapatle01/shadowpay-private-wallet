# ShadowPay Private Wallet

ShadowPay is a full-stack Web3 prototype for privacy-first blockchain payments on Ethereum Sepolia. It demonstrates a simplified privacy-pool architecture where ETH is deposited into a fixed-denomination pool and later withdrawn with a private note, instead of making a direct wallet-to-wallet transfer on-chain.

## Why ShadowPay Exists

Public blockchains are excellent at verification, but standard transfers expose:

- sender and receiver addresses
- transfer amounts
- transaction timing
- wallet relationship graphs

That model is useful for settlement, but weak for personal or business payment privacy.

ShadowPay introduces a privacy layer on top of Sepolia by replacing direct transfers with a pool deposit and note withdrawal flow. The blockchain can see that a deposit happened and that a withdrawal happened, but it cannot directly link which deposit funded which withdrawal.

## Project Overview

ShadowPay includes:

- a Next.js frontend with a modern Web3 dashboard
- MetaMask wallet connection
- a deposit flow that creates a secret note and pool commitment
- a withdrawal flow that spends a nullifier and releases real Sepolia ETH
- an Express backend that simulates proof generation and signs withdrawal authorization
- lightweight JSON-backed storage for commitments and note state
- a Solidity privacy-pool contract deployed to Ethereum Sepolia

## Architecture

### Frontend

The frontend lives in [frontend](/Users/aditya/Developer/shadowpay-private-wallet/frontend) and provides:

- landing page
- dashboard
- deposit page
- withdrawal page
- confidential transaction history

### Backend

The backend lives in [backend](/Users/aditya/Developer/shadowpay-private-wallet/backend) and is responsible for:

- commitment generation
- note hashing
- withdrawal validation
- verifier-signature generation
- transaction persistence

### Smart Contract

The Solidity contract lives in [contracts/ShadowPayPool.sol](/Users/aditya/Developer/shadowpay-private-wallet/contracts/ShadowPayPool.sol) and models:

- `deposit(bytes32 commitment)`
- `withdraw(bytes32 nullifier, address receiver, bytes signature)`
- fixed pool denomination storage
- nullifier replay protection

## How the Privacy Pool Works

ShadowPay uses a hackathon-friendly simulation of a privacy pool.

### Deposit

1. The backend generates a random `secret` and `nullifier`.
2. It hashes them into:
   - `commitmentHash = SHA256(secret + ":" + nullifier)`
   - `nullifierHash = SHA256(nullifier)`
3. The frontend calls `deposit(commitmentHash)` on Sepolia with the fixed ETH amount.
4. The pool contract stores only the commitment.
5. The note is stored locally in the browser and can be shared off-chain.

### Withdrawal

1. The user provides the `secret`, `nullifier`, and receiver address.
2. The backend recomputes the commitment and confirms the note exists and is unspent.
3. The backend signs a withdrawal authorization for the `nullifierHash` and receiver.
4. The frontend calls `withdraw(nullifierHash, receiver, signature)`.
5. The contract marks the nullifier as spent and transfers ETH to the receiver.

### Why This Hides the Link

- the deposit stores only a commitment
- the withdrawal uses only a nullifier and receiver
- the contract does not receive the original commitment during withdrawal
- observers can see deposits and withdrawals, but cannot directly match them

This is still a simulation, not a real zk-SNARK system. The backend acts as a trusted verifier signer instead of a zero-knowledge circuit.

## How Nullifiers Prevent Double Spending

Every note has a derived `nullifierHash`. Once a withdrawal succeeds:

- the contract marks the nullifier as spent
- the same note cannot be withdrawn a second time

This is the core anti-double-spend control in the prototype.

## API Endpoints

### `POST /api/generate-commitment`

Returns:

- `secret`
- `nullifier`
- `commitmentHash`
- `nullifierHash`
- `note`

### `POST /api/record-deposit`

Records a confirmed Sepolia deposit for a commitment.

### `POST /api/withdraw`

Validates the note and returns:

- `commitmentHash`
- `nullifierHash`
- `signature`

### `POST /api/record-withdrawal`

Records a confirmed Sepolia withdrawal.

### `GET /api/transactions`

Returns deposit and withdrawal activity history.

## User Flow

1. Open `http://localhost:3000`
2. Click `Launch App`
3. Connect MetaMask
4. Open `Deposit`
5. Deposit the fixed pool amount on Sepolia
6. Back up the generated note
7. Open `Withdraw`
8. Paste or select the note and choose a receiver address
9. Confirm the withdrawal in MetaMask
10. Review the confidential activity in the history page

## Run Locally

### Prerequisites

- Node.js 18 or newer
- npm
- MetaMask
- Sepolia ETH for wallet gas and pool testing
- a Sepolia RPC URL

## Deploy the Contract to Sepolia

The deployment toolchain lives in [contracts](/Users/aditya/Developer/shadowpay-private-wallet/contracts).

```bash
cd contracts
npm install
cp .env.example .env
npm run compile
npm run deploy:sepolia
npm run smoke:sepolia
```

`contracts/.env` must include:

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
SEPOLIA_PRIVATE_KEY=your_private_key
POOL_VERIFIER_PRIVATE_KEY=your_private_key_or_dedicated_verifier_key
SHADOWPAY_POOL_DEPOSIT_AMOUNT_ETH=0.01
```

After deployment, the script writes the contract address to [contracts/deployments/sepolia.json](/Users/aditya/Developer/shadowpay-private-wallet/contracts/deployments/sepolia.json).
The optional `npm run smoke:sepolia` script performs a live deposit and withdrawal against the running backend so you can verify the pool end to end.

### Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:3001`.

Create `backend/.env` if it does not exist:

```bash
POOL_VERIFIER_PRIVATE_KEY=your_private_key_or_dedicated_verifier_key
SHADOWPAY_POOL_DEPOSIT_AMOUNT_ETH=0.01
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_SHADOWPAY_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SHADOWPAY_CONTRACT_ADDRESS=0xYourSepoliaPoolAddress
```

## Local Demo Checklist

- open `http://localhost:3000`
- connect MetaMask
- switch MetaMask to Sepolia when prompted
- deposit the fixed pool amount
- back up the generated note
- withdraw to a fresh receiver address
- confirm the history page shows the activity as `Confidential`

## Future Improvements

- real zk-SNARK integration instead of backend-signed withdrawal authorization
- Layer-2 privacy networks for lower-cost shielded settlement
- stealth address support for better receiver privacy
- private DeFi payments routed through shielded liquidity systems

## Demo Positioning

ShadowPay is designed to feel like a real fintech wallet demo while remaining understandable and runnable locally. It is a prototype, but the deposit-note-withdraw flow mirrors the direction a real privacy-preserving payment wallet would take.
