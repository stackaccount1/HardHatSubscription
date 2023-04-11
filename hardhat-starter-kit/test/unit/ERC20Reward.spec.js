const { network, deployments, ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect, revertedWith } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Subscription Consumer Tests", async function () {
          //set log level to ignore non errors
          let subscriptionFactory
          let Subscription
          let deployer
          let mockV3Aggregator
          let mockV3AggregatorFactory
          //onst oneThousandthETHER = ethers.utils.parseEther(0.0001)
          //const oneEthereumKoin = ethers.utils.parseEther(1)
          //ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)
          //const oneThousandthETHER = ethers.utils.parseEther(0.0001)
          // We define a fixture to reuse the same setup in every test.
          // We use loadFixture to run this setup once, snapshot that state,
          // and reset Hardhat Network to that snapshot in every test.
          /*async function deployERC20() {
              const [deployer] = await ethers.getSigners()
              //await deployments.fixture["all"]
              const token = await ethers.getContractFactory("ERC20Standard")
              const ERC20 = await token.connect(deployer).deploy("Token", "TKN")
              //const chainId = network.config.chainId
              //const Token = await Token.connect(deployer).deploy("Token", "TKN")
              //const ERC20 = await ethers.getContract("ERC20standard")

              return { ERC20 }
          }*/
          async function deployContractAndPrice() {
              // const accounts = await ethers.getSigners()
              const [aDeployer] = await ethers.getSigners()
              const DECIMALS = "18"
              const INITIAL_PRICE = "200000000000000000000"

              mockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator")
              mockV3Aggregator = await mockV3AggregatorFactory
                  .connect(aDeployer)
                  .deploy(DECIMALS, INITIAL_PRICE)

              subscriptionFactory = await ethers.getContractFactory("Subscription")
              Subscription = await subscriptionFactory
                  .connect(aDeployer)
                  .deploy(10, mockV3Aggregator.address)

              return { Subscription, mockV3Aggregator }
          }

          describe("Contract Functionality", async function () {
              describe("Pricing Oracle Working Correctly", async function () {
                  it("It should set the aggregator address correctly", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const aResponse = await Subscription.getPriceFeed()
                      assert.equal(aResponse, mockV3Aggregator.address)
                  })
                  it("It should return the same value as the mock", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const priceConsumerResult = await Subscription.getLatestPrice()
                      const priceFeedResult = (await mockV3Aggregator.latestRoundData()).answer
                      assert.equal(priceConsumerResult.toString(), priceFeedResult.toString())
                  }) /*
                  it("It should return $2000 per one Ethereum koin", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const etheruemUnitsOfUSD = await Subscription.getOneEthPriceTest({
                          value: oneEthereumKoin,
                      })
                      assert.equal("2000", etheruemUnitsOfUSD.toString())
                  })
                  it("A subscription should revert if you send to little ether", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      await expect(
                          Subscription.takePayment(deployer.address, 1, {
                              value: oneThousandthETHER,
                          })
                      ).to.be.revertedWith("not enough ether submitted")
                  })*/
              })
          })
      })
