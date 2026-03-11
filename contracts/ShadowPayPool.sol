// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ShadowPayPool {
    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifiers;

    uint256 public immutable depositAmount;
    address public immutable verifier;

    bool private locked;

    event Deposit(bytes32 indexed commitment, uint256 timestamp);
    event Withdrawal(address indexed to, bytes32 indexed nullifier);

    modifier nonReentrant() {
        require(!locked, "ShadowPayPool: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    constructor(address verifierAddress, uint256 fixedDepositAmount) {
        require(verifierAddress != address(0), "ShadowPayPool: invalid verifier");
        require(fixedDepositAmount > 0, "ShadowPayPool: invalid deposit amount");

        verifier = verifierAddress;
        depositAmount = fixedDepositAmount;
    }

    function deposit(bytes32 commitment) external payable {
        require(msg.value == depositAmount, "ShadowPayPool: incorrect deposit amount");
        require(commitment != bytes32(0), "ShadowPayPool: invalid commitment");
        require(!commitments[commitment], "ShadowPayPool: commitment exists");

        commitments[commitment] = true;

        emit Deposit(commitment, block.timestamp);
    }

    function withdraw(
        bytes32 nullifier,
        address receiver,
        bytes calldata signature
    ) external nonReentrant {
        require(receiver != address(0), "ShadowPayPool: invalid receiver");
        require(nullifier != bytes32(0), "ShadowPayPool: invalid nullifier");
        require(!nullifiers[nullifier], "ShadowPayPool: nullifier used");
        require(
            _recoverSigner(getWithdrawalMessage(nullifier, receiver), signature) == verifier,
            "ShadowPayPool: invalid proof"
        );

        nullifiers[nullifier] = true;

        (bool success, ) = payable(receiver).call{value: depositAmount}("");
        require(success, "ShadowPayPool: transfer failed");

        emit Withdrawal(receiver, nullifier);
    }

    function getWithdrawalMessage(bytes32 nullifier, address receiver)
        public
        view
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(block.chainid, address(this), nullifier, receiver));
    }

    function _recoverSigner(bytes32 message, bytes calldata signature)
        internal
        pure
        returns (address)
    {
        bytes32 ethSigned = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );

        require(signature.length == 65, "ShadowPayPool: invalid signature");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "ShadowPayPool: invalid v");

        return ecrecover(ethSigned, v, r, s);
    }
}
