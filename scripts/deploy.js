const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  const reserveAddress = deployer.address;
  const genesisNode = deployer.address;

  const SeoralinkCore = await hre.ethers.getContractFactory("SeoralinkCore");
  const core = await SeoralinkCore.deploy(usdtAddress, reserveAddress, genesisNode);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("SeoralinkCore deployed to:", coreAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
