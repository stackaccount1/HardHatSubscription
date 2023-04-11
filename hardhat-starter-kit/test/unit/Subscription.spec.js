const { network, deployments, ethers } = require("hardhat")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")
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
              const automationUpdateInterval = "2629800"

              oneThousandthETHER = ethers.utils.parseEther("0.0001")
              oneEthereumKoin = ethers.utils.parseEther("1")

              mockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator")
              mockV3Aggregator = await mockV3AggregatorFactory
                  .connect(aDeployer)
                  .deploy(DECIMALS, INITIAL_PRICE)

              subscriptionFactory = await ethers.getContractFactory("Subscription")
              Subscription = await subscriptionFactory
                  .connect(aDeployer)
                  .deploy(10, mockV3Aggregator.address, automationUpdateInterval)

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
                  it("A subscription should not revert if you send the correct ether and correctly log the epochs", async () => {
                      let pointTwo = ethers.utils.parseEther("0.2") // 2 cents
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const response = await Subscription.takePayment(deployer.address, 4, {
                          value: pointTwo,
                      })
                      const epochCheck = await Subscription.readSubscribersEpoch(deployer.address)
                      assert.equal(epochCheck.toString(), 5)
                  })
              })
              describe("Epoch Logic", async function () {
                  it("It should return 0 when no payment was rendered to the contract intially", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const aResponse = await Subscription.readMyEpochussy()
                      assert.equal(aResponse, 0)
                  })
                  it("It should return 0 when no payment was rendered to the contract intially from multiple accounts", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      const aResponse = await Subscription.connect(account1).readMyEpochussy()
                      assert.equal(aResponse, 0)
                  })
                  it("It should return false when no payment was rendered to the contract intially", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const aResponse = await Subscription.checkSubscription()
                      assert.equal(aResponse, false)
                  })
                  it("It should return false when no payment was rendered to the contract intially from multiple accounts", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      const aResponse = await Subscription.connect(account1).checkSubscription()
                      assert.equal(aResponse, false)
                  })
                  it("It should return false when no payment was rendered to the contract intially from non-self", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      const aResponse = await Subscription.connect(account1).checkASubscription(
                          account2.address
                      )
                      assert.equal(aResponse, false)
                  })
                  it("It should return true when payment was rendered to the contract and we increment Epoch until the last period", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      let pointTwo = ethers.utils.parseEther("0.2") // 2 cents
                      const response = await Subscription.takePayment(deployer.address, 4, {
                          value: pointTwo,
                      })
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      //const epochCheck = await Subscription.readSubscribersEpoch(deployer.address)
                      //assert.equal(epochCheck.toString(), 5) we are paid to the fifth period
                      // iterate to the fifth period and assert a true / next iterate to 6 and assert a false
                      const aResponse = await Subscription.checkSubscription()
                      assert.equal(aResponse, true)
                  })
                  it("It should return false when payment was rendered to the contract intially but the epoch paid period is passed", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      let pointTwo = ethers.utils.parseEther("0.2") // 2 cents
                      const response = await Subscription.takePayment(deployer.address, 4, {
                          value: pointTwo,
                      })
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      const epochSix = await Subscription.updateEpoch()
                      //const epochCheck = await Subscription.readSubscribersEpoch(deployer.address)
                      //assert.equal(epochCheck.toString(), 5) we are paid to the fifth period
                      // iterate to the fifth period and assert a true / next iterate to 6 and assert a false
                      const aResponse = await Subscription.checkSubscription()
                      assert.equal(aResponse, false)
                  })
                  it("It should return true when payment was rendered to the contract and the epoch period is incremented, non owner check", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      let pointTwo = ethers.utils.parseEther("0.2") // 2 cents
                      const response = await Subscription.takePayment(account1.address, 4, {
                          value: pointTwo,
                      })
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      const aResponse = await Subscription.connect(account1).checkSubscription()
                      assert.equal(aResponse, true)
                  })
                  it("It should return true when payment was rendered to the contract and the epoch period is incremented, non owner check", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      let pointTwo = ethers.utils.parseEther("0.2") // 2 cents
                      const response = await Subscription.takePayment(account2.address, 4, {
                          value: pointTwo,
                      })
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      const aResponse = await Subscription.connect(account1).checkASubscription(
                          account2.address
                      )
                      assert.equal(aResponse, true)
                  })
                  it("It should return false when payment was rendered to the contract intially but the epoch paid period is passed from non owner", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      let pointTwo = ethers.utils.parseEther("0.2") // 2 cents
                      const response = await Subscription.takePayment(account1.address, 4, {
                          value: pointTwo,
                      })
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      const epochSix = await Subscription.updateEpoch()
                      const aResponse = await Subscription.connect(account1).checkSubscription()
                      assert.equal(aResponse, false)
                  })
                  it("It should return false when payment was rendered to the contract intially but the epoch paid period is passed from non owner, check someone else", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      let pointTwo = ethers.utils.parseEther("0.2") // 2 cents
                      const response = await Subscription.takePayment(account2.address, 4, {
                          value: pointTwo,
                      })
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      const epochSix = await Subscription.updateEpoch()
                      const aResponse = await Subscription.connect(account1).checkASubscription(
                          account2.address
                      )
                      assert.equal(aResponse, false)
                  })
                  it("It should return true when the Epoch was incremented several times to epoch 5, then payment was rendered to the contract for 5 periods and the epoch period is incremented to 10, non owner check", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      let pointTwo = ethers.utils.parseEther("0.25") // 2 cents
                      const response = await Subscription.takePayment(account1.address, 5, {
                          value: pointTwo,
                      })
                      const epochSix = await Subscription.updateEpoch()
                      const epochSeven = await Subscription.updateEpoch()
                      const epochEight = await Subscription.updateEpoch()
                      const epochNine = await Subscription.updateEpoch()
                      const epochTen = await Subscription.updateEpoch()
                      const aResponse = await Subscription.connect(account1).checkSubscription()
                      assert.equal(aResponse, true)
                  })
                  it("It should return true when the Epoch was incremented several times to epoch 5, then payment was rendered to the contract for 5 periods and the epoch period is incremented to 10, non owner check non self check", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      let pointTwo = ethers.utils.parseEther("0.25") // 2 cents
                      const response = await Subscription.takePayment(account1.address, 5, {
                          value: pointTwo,
                      })
                      const epochSix = await Subscription.updateEpoch()
                      const epochSeven = await Subscription.updateEpoch()
                      const epochEight = await Subscription.updateEpoch()
                      const epochNine = await Subscription.updateEpoch()
                      const epochTen = await Subscription.updateEpoch()
                      const aResponse = await Subscription.connect(account1).checkSubscription()
                      assert.equal(aResponse, true)
                  })
                  it("It should return false when the Epoch was incremented several times to epoch 5, then payment was rendered to the contract for 5 periods and the epoch period is incremented to 11, non owner check", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      let pointTwo = ethers.utils.parseEther("0.25") // 2 cents
                      const response = await Subscription.takePayment(account1.address, 5, {
                          value: pointTwo,
                      })
                      const epochSix = await Subscription.updateEpoch()
                      const epochSeven = await Subscription.updateEpoch()
                      const epochEight = await Subscription.updateEpoch()
                      const epochNine = await Subscription.updateEpoch()
                      const epochTen = await Subscription.updateEpoch()
                      const epochEleven = await Subscription.updateEpoch()
                      const aResponse = await Subscription.connect(account1).checkSubscription()
                      assert.equal(aResponse, false)
                  })
                  it("It should return false when the Epoch was incremented several times to epoch 5, then payment was rendered to the contract for 5 periods and the epoch period is incremented to 11, non owner check non self check", async () => {
                      const { Subscription, mockV3Aggregator } = await loadFixture(
                          deployContractAndPrice
                      )
                      const [account, account1, account2] = await ethers.getSigners()
                      const epochTwo = await Subscription.updateEpoch()
                      const epochThree = await Subscription.updateEpoch()
                      const epochFour = await Subscription.updateEpoch()
                      const epochFive = await Subscription.updateEpoch()
                      let pointTwo = ethers.utils.parseEther("0.25") // 2 cents
                      const response = await Subscription.takePayment(account2.address, 5, {
                          value: pointTwo,
                      })
                      const epochSix = await Subscription.updateEpoch()
                      const epochSeven = await Subscription.updateEpoch()
                      const epochEight = await Subscription.updateEpoch()
                      const epochNine = await Subscription.updateEpoch()
                      const epochTen = await Subscription.updateEpoch()
                      const epochEleven = await Subscription.updateEpoch()
                      const aResponse = await Subscription.connect(account1).checkASubscription(
                          account2.address
                      )
                      assert.equal(aResponse, false)
                  })
              })
              describe("Check Mock Timing Keepers Works Correctly", async function () {
                  it("#checkUpkeep - should be able to call checkUpkeep", async function () {
                      const { Subscription } = await loadFixture(deployContractAndPrice)
                      const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
                      const { upkeepNeeded } = await Subscription.callStatic.checkUpkeep(checkData)
                      assert.equal(upkeepNeeded, false)
                  })
                  it("#performUpkeep - should be able to call performUpkeep after time passes", async function () {
                      const { Subscription } = await loadFixture(deployContractAndPrice)
                      const startingCount = await Subscription.counter()
                      const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
                      const interval = await Subscription.interval()
                      await time.increase(interval.toNumber() + 1)
                      await Subscription.performUpkeep(checkData)
                      assert.equal(startingCount + 1, (await Subscription.counter()).toNumber())
                  })
                  it("failure - should not be able to call perform upkeep without the time passed interval", async function () {
                      const { Subscription } = await loadFixture(deployContractAndPrice)
                      const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
                      await expect(Subscription.performUpkeep(checkData)).to.be.revertedWith(
                          "Time interval not met"
                      )
                  })
                  it("#performUpkeep - should be able to call performUpkeep twice after time passes + Month + 1 second", async function () {
                      const { Subscription } = await loadFixture(deployContractAndPrice)
                      const startingCount = await Subscription.counter()
                      const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
                      const interval = await Subscription.interval()
                      await time.increase(interval.toNumber() + 1)
                      await Subscription.performUpkeep(checkData)
                      await time.increase(interval.toNumber())
                      await Subscription.performUpkeep(checkData)
                      assert.equal(startingCount + 2, (await Subscription.counter()).toNumber())
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
