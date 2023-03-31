// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.0;

// Subscription Monthly Payment Contract
// 1. Contract is controlled by gelato service
// 2. Monthly Epoch is incremented for eternity by gelato service or manually -> if manually, a delay in updating updateEpoch only allows customers to get more time for what they paid
// 3. A check can be done on the delta of monthly epoch from month of origination
// 4.

contract Subscription {
    //State Variables
    address private immutable i_owner;
    //For Reference
    uint256 immutable i_start;
    // Let a grace period exist allowing a subscriptionoor to game 2 months for price of 1
    bool lenient = false;
    // Payment Type - dynamic to discourage gaming and prioritizing upfront payment or let gaming be possible
    bool dynamic = true;
    // Monthly Epoch
    uint256 epoch;
    mapping(address => uint256) epochPaid;

    modifier onlyOwner() {
        require(msg.sender == i_owner, "Only owner can call this function.");
        _;
    }

    //epoch starts at period 1
    constructor() {
        i_owner = msg.sender;
        epoch = 0;
        i_start = block.timestamp;
    }

    function updateEpoch() public onlyOwner {
        epoch += 1;
    }

    function takePayment(address _recievooor, uint256 _periods) public {
        if (!dynamic) {
            _makePayment(_recievooor, _periods);
        } else {
            _makePricePayment(_recievooor, _periods);
        }
    }

    function _makePayment(
        address _recievooor,
        uint256 _periods
    ) internal payable {
        uint value = 1 ether * _periods;
        require(msg.value >= value, "not enough ether submitted");
        // EpochPaid updated to epoch + 1 on minimum paid; user can game system letting the second epoch month expire then paying the 3rd epoch
        // A user paying inside of the middle or end of the month benefits positively from this
        // Ideally a user for convience will pay a several months ahead of time or years
        // A pricing mechanism can be added here to highly discourage gaming like a 2X price increase on 1-2 month payments
        epochPaid[_recievooor] = epoch + _periods;
    }

    function _dynamicPricePayment(
        address _recievooor,
        uint256 _periods
    ) internal payable {
        if (_periods > 3) {
            uint value = 1 ether * _periods;
            require(msg.value >= value, "not enough ether submitted");
            // EpochPaid updated to epoch + 1 on minimum paid; user can game system letting the second epoch month expire then paying the 3rd epoch
            // A user paying inside of the middle or end of the month benefits positively from this
            // Ideally a user for convience will pay a several months ahead of time or years
            // A pricing mechanism can be added here to highly discourage gaming like a 2X price increase on 1-2 month payments
            epochPaid[_recievooor] = epoch + _periods;
        } else {
            uint valueDoubler = 2 ether * _periods;
            require(msg.value >= valueDoubler, "not enough ether submitted");
            epochPaid[_recievooor] = epoch + _periods;
        }
    }

    function checkSubscription() public view returns (bool) {
        if (!lenient) {
            if (epochPaid[msg.sender] >= epoch) {
                return true;
            } else {
                return false;
            }
        } else {
            if (epochPaid[msg.sender] >= epoch - 1) {
                return true;
            } else {
                return false;
            }
        }
    }

    function changeGracePeriod(bool _passed) public onlyOwner returns (bool) {
        lenient = _passed;
        return lenient;
    }

    function changePaymentStyle(bool _passed) public onlyOwner returns (bool) {
        dynamic = _passed;
        return dynamic;
    }
}
