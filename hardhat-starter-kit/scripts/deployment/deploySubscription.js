const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")

async function deploySubscription() {
    if (developmentChains.includes(network.name)) {
        //const Name = "TokenReward"
        //const Symbol = "rTKN"
        const getSubscriptionContract = await ethers.getContractFactory("Subscription")
        const ERC20Reward = await getERC20TokenContract.deploy()
    }
}

module.exports = {
    deploySubscription,
}
