const { network, deployments, ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Subscription Consumer Tests", async function () {
          //set log level to ignore non errors
          let subscriptionFactory
          let Subscription
          let deployer
          let mockV3Aggregator
          let mockV3AggregatorFactory
          //ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)
          //const oneThousandthETHER = ethers.utils.parseEther(0.0001)
          //const oneEthereumKoin = ethers.utils.parseEther(1)
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
              deployer = aDeployer
              const DECIMALS = "18"
              const INITIAL_PRICE = "200000000000000000000"
              oneThousandthETHER = ethers.utils.parseEther("0.0001")
              oneEthereumKoin = ethers.utils.parseEther("1")

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
              oneThousandthETHER = ethers.utils.parseEther("0.0001")
              oneEthereumKoin = ethers.utils.parseEther("1")
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
                  })
                  it("It should return $200 per one Ethereum koin", async () => {
                      let oneEthereumKoin = ethers.utils.parseEther("1")
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const etheruemUnitsOfUSD = await Subscription.getOneEthPriceTest()
                      assert.equal(200, etheruemUnitsOfUSD.toString())
                  })
                  it("It should return .05 ETH for subscription fee", async () => {
                      let pointZeroFive = ethers.utils.parseEther(".05")
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const etheruemUnitsOfUSD = await Subscription.getResultOfConversion()
                      assert.equal(pointZeroFive.toString(), etheruemUnitsOfUSD.toString())
                  })

                  it("A subscription should revert if you send to little ether", async () => {
                      let oneTenThousandthETHER = ethers.utils.parseEther("0.04") // 2 cents
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      await expect(
                          Subscription.takePayment(deployer.address, 1, {
                              value: oneTenThousandthETHER,
                          })
                      ).to.be.revertedWith("not enough ether submitted")
                  })
              })
          })
      })

/*
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Subscription Consumer Unit Tests", async function () {
          // We define a fixture to reuse the same setup in every test.
          // We use loadFixture to run this setup once, snapshot that state,
          // and reset Hardhat Network to that snapshot in every test.
          async function deployPrice() {
              const [deployer] = await ethers.getSigners()

              const DECIMALS = "18"
              const INITIAL_PRICE = "200000000000000000000"

              const mockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator")
              const mockV3Aggregator = await mockV3AggregatorFactory
                  .connect(deployer)
                  .deploy(DECIMALS, INITIAL_PRICE)

              const subscriptionFactory = await ethers.getContractFactory("Subscription")
              const subscription = await subscriptionFactory
                  .connect(deployer)
                  .deploy(10, mockV3Aggregator.address)

              return { subscription, mockV3Aggregator }
          }

          const oneThousandthETHER = ethers.utils.parseEther(0.0001)

          describe("deployment", async function () {
              describe("success", async function () {
                  it("should set the aggregator addresses correctly", async () => {
                      const { subscription, mockV3Aggregator } = await loadFixture(deployPrice)
                      const response = await subscription.getPriceFeed()
                      assert.equal(response.address, mockV3Aggregator.address)
                  })
              })
          })

          describe("#getLatestPrice", async function () {
              describe("success", async function () {
                  it("should return the same value as the mock", async () => {
                      const { subscription, mockV3Aggregator } = await loadFixture(deployPrice)
                      const priceConsumerResult = await subscription.getLatestPrice()
                      const priceFeedResult = (await mockV3Aggregator.latestRoundData()).answer
                      assert.equal(priceConsumerResult.toString(), priceFeedResult.toString())
                  })
              })
          })
          describe("#A subscription should revert if you send to little ether", async function () {
              describe("success", async function () {
                  it("should return the same value as the mock", async () => {
                      const { subscription, mockV3Aggregator } = await loadFixture(deployPrice)
                      const renderPayment = await subscription.takePayment(deployer.address)
                      const priceFeedResult = (await mockV3Aggregator.latestRoundData()).answer
                      await expect(
                          subscription.takePayment(deployer.address, 1, {
                              value: oneThousandthETHER,
                          })
                      ).to.be.revertedWith("not enough ether submitted")
                  })
              })
          })
      })
*/
