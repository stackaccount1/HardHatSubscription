// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.7;

// Subscription Monthly Payment Contract
// -> Contract is controlled by chainlink keepers
// -> Monthly Epoch is incremented for eternity by gelato service or manually -> if manually, a delay in updating updateEpoch only allows customers to get more time for what they paid
// -> A check can be done on the delta of monthly epoch from month of origination
// ->

// 2. Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

contract Subscription {
    using PriceConverter for uint256;
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
    // epochPaid   address => epochPaid    Customer => Epoch Period Paid Till
    mapping(address => uint256) epochPaid;
    // usd pricing
    uint usdPrice;
    //comment
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        require(msg.sender == i_owner, "Only owner can call this function.");
        _;
    }

    //epoch starts at 0
    constructor(uint256 _initialSubPrice, address priceFeed) {
        i_owner = msg.sender;
        epoch = 0;
        i_start = block.timestamp;
        usdPrice = _initialSubPrice;
        s_priceFeed = AggregatorV3Interface(priceFeed);
    }

    function updateEpoch() public onlyOwner {
        epoch += 1;
    }

    function takePayment(address _recievooor, uint256 _periods) public payable {
        if (!dynamic) {
            _makePayment(_recievooor, _periods);
        } else {
            _dynamicPricePayment(_recievooor, _periods);
        }
    }

    function _makePayment(address _recievooor, uint256 _periods) internal {
        uint value = usdPrice * _periods;
        require(
            msg.value.getConversionRate(s_priceFeed) >= value,
            "not enough ether submitted"
        );
        // EpochPaid updated to epoch + 1 on minimum paid; user can game system letting the second epoch month expire then paying at the beginning the 3rd epoch, extending through to 4 epochs for the price of two
        // A user paying inside of the middle or end of the month benefits positively from this lets say gets a month and a half for the price of one if paid on the 15th
        // Ideally a user will pay several months ahead of time or years for convienence
        // A dynamic pricing mechanism is added below to highly discourage gaming -> a 2X price increase on 1-3 month minimum payments
        // For simplicity this seems as the best idea than trying to figure intra month timing inside or outside the contract
        // Pricing should be adjusted accordingly for the loss of 1 month every 4 if the customer is paying every 4 months on the end of the fifth month after expiry of epoch..........
        epochPaid[_recievooor] = epoch + _periods;
    }

    function _dynamicPricePayment(
        address _recievooor,
        uint256 _periods
    ) internal {
        if (_periods > 3) {
            uint value = usdPrice * _periods;
            require(
                msg.value.getConversionRate(s_priceFeed) >= value,
                "not enough ether submitted"
            );
            epochPaid[_recievooor] = epoch + _periods;
        } else {
            // Making a payment <3 will result in double the cost
            // For simplicity this seems as the best idea than trying to figure timing inside the contract
            // pricing should be adjusted accordingly for the loss of 1 month every 4 if the customer is paying every 4 months on the end of the fifth month after expiry of epoch..........
            uint valueDoubler = 2 * usdPrice * _periods;
            require(
                msg.value.getConversionRate(s_priceFeed) >= valueDoubler,
                "not enough ether submitted"
            );
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

    function changePrice(
        uint _priceInUsdTerms
    ) public onlyOwner returns (uint256) {
        usdPrice = _priceInUsdTerms;
        return usdPrice;
    }

    function readMyEpochussy() public view returns (uint256) {
        return epochPaid[msg.sender];
    }

    function readCurrentEpoch() public view returns (uint256) {
        return epoch;
    }

    function readSubscribersEpoch(
        address _recievooor
    ) public view returns (uint256) {
        return epochPaid[_recievooor];
    }
}
