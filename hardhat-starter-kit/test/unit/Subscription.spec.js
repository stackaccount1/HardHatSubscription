const { network, ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Subscription Consumer Unit Tests", async function () {
          // We define a fixture to reuse the same setup in every test.
          // We use loadFixture to run this setup once, snapshot that state,
          // and reset Hardhat Network to that snapshot in every test.
          async function deployPriceConsumerFixture() {
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

          describe("deployment", async function () {
              describe("success", async function () {
                  it("should set the aggregator addresses correctly", async () => {
                      const { subscription, mockV3Aggregator } = await loadFixture(
                          deployPriceConsumerFixture
                      )
                      const response = await subscription.getPriceFeed()
                      assert.equal(response, mockV3Aggregator.address)
                  })
              })
          })

          describe("#getLatestPrice", async function () {
              describe("success", async function () {
                  it("should return the same value as the mock", async () => {
                      const { subscription, mockV3Aggregator } = await loadFixture(
                          deployPriceConsumerFixture
                      )
                      const priceConsumerResult = await subscription.getLatestPrice()
                      const priceFeedResult = (await mockV3Aggregator.latestRoundData()).answer
                      assert.equal(priceConsumerResult.toString(), priceFeedResult.toString())
                  })
              })
          })
      })
