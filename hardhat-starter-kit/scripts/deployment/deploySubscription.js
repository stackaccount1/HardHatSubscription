const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")
//2629800 is a month in seconds
async function deploySubscription(chainId) {
    let priceFeedAddress

    if (developmentChains.includes(network.name)) {
        const DECIMALS = "18"
        const INITIAL_PRICE = "200000000000000000000"

        const mockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator")
        const mockV3Aggregator = await mockV3AggregatorFactory.deploy(DECIMALS, INITIAL_PRICE)

        priceFeedAddress = mockV3Aggregator.address
    } else {
        priceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const subscriptionFactory = await ethers.getContractFactory("Subscription")
    //2629800 is a month in seconds
    const Subscription = await subscriptionFactory.deploy(10, priceFeedAddress, "2629800")
    console.log(`Subscription deployed to ${Subscription.address} on ${network.name}`)
}

module.exports = {
    deploySubscription,
}
