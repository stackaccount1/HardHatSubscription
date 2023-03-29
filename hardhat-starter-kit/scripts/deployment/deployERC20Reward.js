const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")

async function deployERC20Reward() {
    if (developmentChains.includes(network.name)) {
        const Name = "TokenReward"
        const Symbol = "rTKN"

        const getERC20TokenContract = await ethers.getContractFactory("ERC20Reward")
        const ERC20Reward = await getERC20TokenContract.deploy(Name, Symbol)
    }
}

module.exports = {
    deployERC20Reward,
}
