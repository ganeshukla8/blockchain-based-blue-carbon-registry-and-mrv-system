require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Local Hardhat network for development/demo (npx hardhat node)
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Fill these in .env and uncomment to deploy to Polygon Amoy testnet for your viva demo
    // polygonAmoy: {
    //   url: process.env.POLYGON_RPC_URL || "",
    //   accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    // },
  },
};
