const { network, deployments, ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { numToBytes32 } = require("../../helper-functions")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("ERC20 Standard Implementation Tests", async function () {
          //set log level to ignore non errors
          let ERC20
          let token
          let deployer
          ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

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
          beforeEach(async () => {
              // const accounts = await ethers.getSigners()
              const [aDeployer] = await ethers.getSigners()
              deployer = aDeployer
              token = await ethers.getContractFactory("ERC20Standard")
              ERC20 = await token.connect(deployer).deploy("Token", "TKN")
          })

          describe("ERC20 Functionality", async function () {
              describe("Mint Security", async function () {
                  it("It should sucessfully show zero supply", async function () {
                      const supply = await ERC20.totalSupply()
                      assert.equal(supply.toString(), 0)
                  })
                  it("It should sucessfully mint 1000 coin by owner", async function () {
                      const response = await ERC20.mint(deployer.address, 1000)
                      const supply = await ERC20.totalSupply()
                      assert.equal(supply.toString(), 1000)
                  })

                  it("Should revert upon trying to mint from non-owner of contract", async function () {
                      const [account, account1] = await ethers.getSigners()
                      await expect(
                          ERC20.connect(account1).mint(account1.address, 1000)
                      ).to.be.revertedWith("Only owner can call this function.")
                  })
                  it("It should sucessfully show supply  at 1000", async function () {
                      const response = await ERC20.mint(deployer.address, 1000)
                      const supply = await ERC20.totalSupply()
                      assert.equal(supply.toString(), 1000)
                  })
                  /*
                  it("Shouldent allow anyone to Mint on the internal function", async function () {
                      const [account, account1] = await ethers.getSigners()
                      var err = new TypeError("ERC20.connect(...)._mint is not a function")
                      await expect(ERC20.connect(account1)._mint(account1.address, 1000)).to.throw(
                          err
                      )
                  })*/
              })
              describe("Transfer/Approval Testing", async function () {
                  it("Should not let you transfer tokens with no balance", async function () {
                      const [account, account1] = await ethers.getSigners()
                      const approval = await ERC20.connect(account1).approve(ERC20.address, 1000)
                      await expect(
                          ERC20.connect(account1).transfer(account.address, 1000)
                      ).to.be.revertedWith("ERC20: transfer amount exceeds balance")
                  })
                  it("Should let you transfer tokens", async function () {
                      const [account, account1] = await ethers.getSigners()
                      const response = await ERC20.mint(deployer.address, 1000)
                      //const approval = await ERC20.approve(ERC20.address, 1000)
                      const trasferCoin = await ERC20.transfer(account1.address, 1000)
                      const balanceAccount1 = await ERC20.balanceOf(account1.address)
                      assert.equal(balanceAccount1.toString(), 1000)
                  })
                  it("Let protocol transfer tokens with an approval", async function () {
                      const [account, account1, account2] = await ethers.getSigners()
                      const response = await ERC20.mint(deployer.address, 1000)
                      //const approval = await ERC20.approve(ERC20.address, 1000)
                      const trasferCoin = await ERC20.transfer(account1.address, 1000)
                      const approval = await ERC20.connect(account1).approve(account2.address, 1000)
                      const transfer2 = await ERC20.connect(account2).transferFrom(
                          account1.address,
                          account2.address,
                          1000
                      )
                      const balanceAccount2 = await ERC20.balanceOf(account2.address)
                      assert.equal(balanceAccount2.toString(), 1000)
                  })
                  it("Revert transfer tokens with no approval", async function () {
                      const [account, account1, account2] = await ethers.getSigners()
                      const response = await ERC20.mint(deployer.address, 1000)
                      const trasferCoin = await ERC20.transfer(account1.address, 1000)
                      //const approval = await ERC20.connect(account1).approve(account2.address, 1000)
                      await expect(
                          ERC20.connect(account2).transferFrom(
                              account1.address,
                              account2.address,
                              1000
                          )
                      ).to.be.revertedWith("ERC20: insufficient allowance")
                  })
                  /*
                it("Shouldent allow anyone to Mint on the internal function", async function () {
                    const [account, account1] = await ethers.getSigners()
                    var err = new TypeError("ERC20.connect(...)._mint is not a function")
                    await expect(ERC20.connect(account1)._mint(account1.address, 1000)).to.throw(
                        err
                    )
                })*/
              })
          })
      })
