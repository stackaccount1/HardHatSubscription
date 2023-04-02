const { getNamedAccounts, deployments, network } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { verify } = require("../../helper-functions")

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress
    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("----------------------------------------------------")
    log("Deploying Subscription Contract and waiting for confirmations...")
    //args = []
    const contract = await deploy("Subscription", {
        from: deployer,
        args: [10, ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations,
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(contract.address, args)
    }
    const networkName = network.name == "hardhat" ? "localhost" : network.name
    log(`Subscription contract - ${contract.address} --network ${networkName}`)
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "anon"]
