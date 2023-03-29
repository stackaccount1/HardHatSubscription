const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")

async function deployERC20() {
    if (developmentChains.includes(network.name)) {
        const Name = "Token"
        const Symbol = "TKN"

        const getERC20TokenContract = await ethers.getContractFactory("ERC20Standard")
        const ERC20 = await getERC20TokenContract.deploy(Name, Symbol)
    }
}

module.exports = {
    deployERC20,
}
