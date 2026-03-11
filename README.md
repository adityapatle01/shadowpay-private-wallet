# ShadowPay – Privacy-Preserving Ethereum Payments

ShadowPay is a privacy-focused blockchain payment prototype that allows users to send ETH without publicly linking the sender and receiver addresses. It implements a simplified privacy pool architecture where funds are deposited into a smart contract and later withdrawn using a cryptographic note.

The project demonstrates how privacy-preserving payments can be built on a transparent blockchain by separating deposits from withdrawals and using commitment-based verification.

---

# Problem

Public blockchains like Ethereum expose financial activity. Every transaction reveals:

* Sender address
* Receiver address
* Amount transferred
* Transaction timestamp

This transparency is useful for security but creates privacy problems for individuals, businesses, and organizations that need confidential payments.

ShadowPay explores a privacy-preserving architecture that hides the relationship between sender and receiver while still allowing the blockchain to verify transactions.

---

# Solution

ShadowPay uses a **fixed-denomination privacy pool** model.

Instead of transferring ETH directly from one wallet to another, the payment is split into two independent transactions:

1. Deposit ETH into a privacy pool
2. Withdraw ETH from the pool using a secret note

Since deposits and withdrawals are not directly linked, observers cannot determine which deposit funded which withdrawal.

---

# How It Works

The system operates in two phases.

## 1. Deposit Phase

The sender deposits a fixed amount of ETH into the ShadowPay pool.

During this process:

* The system generates two random values: `secret` and `nullifier`
* These values create a **commitment hash**
* The commitment is stored on-chain
* The ETH remains inside the pool contract

Example:

Sender → ShadowPay Pool
Value: 0.01 ETH

The sender receives a **withdrawal note** that contains the secret and nullifier.

Example note:

shadowpay-0.01ETH-8f39ab28d2c7a1df9...

---

## 2. Withdrawal Phase

The receiver uses the withdrawal note to claim the funds.

The contract verifies that:

* The commitment exists
* The nullifier has not been used before
* The withdrawal is valid

Once verified, the ETH is transferred from the pool to the receiver's wallet.

Example:

ShadowPay Pool → Receiver Wallet
Value: 0.01 ETH

---

# Privacy Model

ShadowPay hides the **link between deposit and withdrawal**.

Observers on a blockchain explorer such as
Etherscan
can see:

Wallet A → ShadowPay Pool
ShadowPay Pool → Wallet B

However, they cannot prove that Wallet A paid Wallet B.

This concept is similar to privacy architectures used in protocols such as
Tornado Cash.

---

# Key Concepts

### Commitment

A cryptographic hash representing a deposit.

commitment = SHA256(secret + nullifier)

The commitment is stored in the smart contract.

### Nullifier

A unique value used to prevent double withdrawals.

Each nullifier can only be used once.

### Withdrawal Note

A private string containing the secret and nullifier required to withdraw funds.

Anyone with this note can withdraw the funds, so it must be kept secure.

---

# Architecture

ShadowPay consists of three main components.

## Frontend

Built using:

* Next.js
* TypeScript
* TailwindCSS
* MetaMask wallet integration

Features:

* Wallet connection
* Deposit interface
* Withdrawal interface
* Transaction history
* Privacy pool dashboard

---

## Backend

Built using:

* Node.js
* Express

Responsibilities:

* Generate commitments
* Create withdrawal notes
* Validate withdrawal requests
* Provide APIs for frontend interaction

---

## Smart Contract

Written in Solidity.

Responsibilities:

* Accept ETH deposits
* Store commitment hashes
* Prevent double withdrawals using nullifiers
* Transfer ETH to withdrawal addresses

---

# User Flow

1. User connects their wallet
2. User deposits a fixed amount of ETH into the ShadowPay pool
3. System generates a withdrawal note
4. User shares the note with the receiver
5. Receiver enters the note in the ShadowPay app
6. Receiver withdraws ETH to their wallet

The blockchain records deposits and withdrawals but cannot link them.

---

# Tech Stack

Frontend

* Next.js
* React
* TailwindCSS
* Ethers.js

Backend

* Node.js
* Express

Blockchain

* Solidity smart contracts
* Hardhat deployment

Network

* Sepolia

---

# Running the Project Locally

Clone the repository.

git clone https://github.com/adityapatle01/shadowpay-private-wallet

cd shadowpay-private-wallet

---

Install backend dependencies.

cd backend
npm install

Start backend server.

npm start

---

Install frontend dependencies.

cd ../frontend
npm install

Run frontend development server.

npm run dev

Frontend will run on:

http://localhost:3000

---

# Deploying the Smart Contract

Deploy the contract using Hardhat.

npx hardhat run scripts/deploy.js --network sepolia

Update the frontend configuration with the new contract address.

---

# Security Notice

This project is a prototype created for learning and experimentation.

It does not include:

* full zero-knowledge proof verification
* Merkle tree privacy sets
* production security audits

Do not use with real funds.

---

# Future Improvements

Potential upgrades include:

* zk-SNARK proof verification
* Merkle tree commitment storage
* stealth addresses
* multiple deposit denominations
* privacy analytics dashboard
* cross-chain privacy transfers

---

# License

MIT License

---

# Author

Aditya Patle
