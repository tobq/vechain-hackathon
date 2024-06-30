// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SustainTransactions {
    address public owner;
    uint256 public transactionCount;
    mapping(address => uint256) public totalSpent;
    mapping(address => uint256) public transactionCounts;

    event TransactionLogged(address indexed user, uint256 amount, uint256 timestamp);
    event CashbackPaid(address indexed user, uint256 cashbackAmount, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function logTransaction(uint256 amount) public {
        totalSpent[msg.sender] += amount;
        transactionCount++;
        transactionCounts[msg.sender]++;

        emit TransactionLogged(msg.sender, amount, block.timestamp);

        // Check for cashback eligibility
        if (transactionCounts[msg.sender] % 5 == 0) {
            uint256 cashback = amount * 0.1;
            require(address(this).balance >= cashback, "Insufficient contract balance for cashback");
            payable(msg.sender).transfer(cashback);
            emit CashbackPaid(msg.sender, cashback, block.timestamp);
        }
    }

    function deposit() public payable onlyOwner {
        // Allow the owner to deposit funds into the contract for cashback
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Insufficient contract balance");
        payable(owner).transfer(amount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        // Function to receive Ether. msg.data must be empty
    }
}
