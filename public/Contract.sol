// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Storage {
    using SafeMath for uint;
    
    event Deposit(address indexed _address, uint256 _amount);
    event Withdrawal(address indexed _address, uint256 _amount);
    mapping (address => uint) public balances;

    constructor() {
    }

    function deposit() external payable {
        require (msg.value > 0);
        balances[msg.sender] = balances[msg.sender].add(msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function withdrawal(uint256 _amount) external {
        require (balances[msg.sender] >= _amount);
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        payable(address(msg.sender)).transfer(_amount);
        emit Withdrawal(msg.sender, _amount);
    }

}