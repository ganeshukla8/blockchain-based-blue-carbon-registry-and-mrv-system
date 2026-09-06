const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const CarbonCreditToken = await hre.ethers.getContractFactory("CarbonCreditToken");
  const token = await CarbonCreditToken.deploy();
  await token.waitForDeployment();
  console.log("CarbonCreditToken deployed to:", await token.getAddress());

  const BlueCarbonRegistry = await hre.ethers.getContractFactory("BlueCarbonRegistry");
  const registry = await BlueCarbonRegistry.deploy(await token.getAddress());
  await registry.waitForDeployment();
  console.log("BlueCarbonRegistry deployed to:", await registry.getAddress());

  // Wire the registry as the token's sole minter
  const tx = await token.setMinter(await registry.getAddress());
  await tx.wait();
  console.log("Minter set to registry contract.");

  // Register the deployer as the first verifier + oracle for local testing
  await (await registry.addVerifier(deployer.address)).wait();
  await (await registry.addOracle(deployer.address)).wait();
  console.log("Deployer added as verifier + oracle (for local/demo use).");

  console.log("\n=== Copy these into backend/.env ===");
  console.log("CREDIT_TOKEN_ADDRESS=" + (await token.getAddress()));
  console.log("REGISTRY_CONTRACT_ADDRESS=" + (await registry.getAddress()));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
