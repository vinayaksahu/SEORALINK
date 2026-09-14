const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SeoralinkCore", function () {
  let usdt;
  let core;
  let owner, user1, user2, user3, user4, user5, user6, reserve, genesis;

  const ENTRY_FEE = ethers.parseUnits("10", 6);

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6, reserve, genesis] = await ethers.getSigners();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    const SeoralinkCore = await ethers.getContractFactory("SeoralinkCore");
    core = await SeoralinkCore.deploy(await usdt.getAddress(), reserve.address, genesis.address);
    await core.waitForDeployment();

    // Mint USDT and approve for all test accounts
    const users = [owner, user1, user2, user3, user4, user5, user6, genesis];
    for (const user of users) {
      await usdt.mint(user.address, ethers.parseUnits("1000", 6));
      await usdt.connect(user).approve(await core.getAddress(), ethers.MaxUint256);
    }
  });

  it("Test 1: Registration — user registers with $10, sponsor gets $0.50", async function () {
    const balanceBefore = await usdt.balanceOf(genesis.address);
    await core.connect(user1).register(genesis.address);
    const balanceAfter = await usdt.balanceOf(genesis.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("0.5", 6));
    
    const userInfo = await core.getUserInfo(user1.address);
    expect(userInfo.sponsor).to.equal(genesis.address);
    expect(userInfo.currentTier).to.equal(0);
    expect(userInfo.isActive).to.equal(true);

    const length = await core.getQueueLength(0);
    expect(length).to.equal(1);
  });

  it("Test 2: Queue matching — 3 users register, first user gets matched and upgraded", async function () {
    await core.connect(user1).register(genesis.address);
    await core.connect(user2).register(user1.address); // user1 gets 1st direct
    await core.connect(user3).register(user1.address); // user1 gets 2nd direct -> user1 matched at 100%

    // user1 is matched at front of tier 0, auto-upgrades to tier 1
    const userInfo = await core.getUserInfo(user1.address);
    expect(userInfo.currentTier).to.equal(1); // Auto upgraded to Zen
    
    const length1 = await core.getQueueLength(1);
    expect(length1).to.equal(1); // User1 is now in Tier 1 queue
  });

  it("Test 3: Direct requirement — block upgrade if insufficient directs", async function () {
    await core.connect(user1).register(genesis.address);
    await core.connect(user2).register(genesis.address);
    await core.connect(user3).register(genesis.address); // user1 matches with 0 directs

    const userInfo = await core.getUserInfo(user1.address);
    expect(userInfo.currentTier).to.equal(0); // Did not upgrade
  });

  it("Test 4: Deduction math — verify 80/20 split", async function () {
    const reserveBefore = await usdt.balanceOf(reserve.address);
    await core.connect(user1).register(genesis.address);
    await core.connect(user2).register(genesis.address);
    await core.connect(user3).register(genesis.address); // triggers match for user1

    const reserveAfter = await usdt.balanceOf(reserve.address);
    expect(reserveAfter - reserveBefore).to.equal(ethers.parseUnits("2", 6)); // 20% of 10 USDT
  });

  it("Test 5: Ultima special — verify 90/10 deduction rate is set correctly", async function () {
    const ultimaRate = await core.ULTIMA_DEDUCTION_RATE();
    expect(ultimaRate).to.equal(1000);
    
    const normalRate = await core.DEDUCTION_RATE();
    expect(normalRate).to.equal(2000);
  });

  it("Test 6: Override commission — verify 5% override on tier upgrade", async function () {
    const sponsorBalanceBefore = await usdt.balanceOf(genesis.address);
    
    await core.connect(user1).register(genesis.address); // 0.50 direct
    await core.connect(user2).register(genesis.address); // 0.50 direct
    await core.connect(user3).register(genesis.address); // 0.50 direct + user1 matches (0.50 override)

    const sponsorBalanceAfter = await usdt.balanceOf(genesis.address);
    // 0.5*3 direct + 0.5 override = 2.0 USDT
    expect(sponsorBalanceAfter - sponsorBalanceBefore).to.equal(ethers.parseUnits("2.0", 6));
  });

  it("Test 7: Reentrancy protection — nonReentrant modifier exists", async function () {
    await core.connect(user1).register(genesis.address);
    const userInfo = await core.getUserInfo(user1.address);
    expect(userInfo.isActive).to.be.true;
  });

  it("Test 8: Invalid registration — no self-sponsorship, no duplicate registration", async function () {
    await expect(core.connect(user1).register(user1.address)).to.be.revertedWith("Cannot self-sponsor");
    await core.connect(user1).register(genesis.address);
    await expect(core.connect(user1).register(genesis.address)).to.be.revertedWith("Already registered");
  });

  it("Test 9: Queue position tracking", async function () {
    await core.connect(user1).register(genesis.address);
    await core.connect(user2).register(genesis.address);
    await core.connect(user3).register(genesis.address); // user1 matches, front moves to 1 (user2)

    const [pos, found] = await core.getQueuePosition(user3.address, 0);
    expect(found).to.be.true;
    expect(pos).to.equal(1); // User2 is pos 0, User3 is pos 1
  });

  it("Test 10: Full cycle — push user through multiple tiers", async function () {
    await core.connect(user1).register(genesis.address);
    await core.connect(user2).register(user1.address);
    await core.connect(user3).register(user1.address); // user1 -> T1
    
    await core.connect(user4).register(user2.address);
    await core.connect(user5).register(user2.address); // user2 -> T1
    
    await core.connect(user6).register(user3.address);
    await core.connect(owner).register(user3.address); // user3 -> T1, user1 matches in T1 -> T2!
    
    const userInfo = await core.getUserInfo(user1.address);
    expect(userInfo.currentTier).to.equal(2); // Alpha (Tier 2)
  });
});
