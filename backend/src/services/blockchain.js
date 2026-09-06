const { ethers } = require("ethers");

/**
 * Thin wrapper around ethers.js for talking to the deployed
 * BlueCarbonRegistry + CarbonCreditToken contracts.
 *
 * The ABIs below are hand-written "human-readable ABI" fragments that match
 * contracts/BlueCarbonRegistry.sol exactly. If you change the Solidity, run
 * `npm run compile` at the repo root and copy the generated ABI from
 * artifacts/contracts/BlueCarbonRegistry.sol/*.json instead of maintaining
 * these by hand.
 */

const REGISTRY_ABI = [
  "function registerProject(string name_, uint8 ecosystem_, string location_, uint256 areaHaScaled_, string docHash_, address projectOwner_) returns (uint256)",
  "function submitMrvResult(uint256 projectId, bool passed, string reportHash)",
  "function verifierDecision(uint256 projectId, bool approve, string note)",
  "function issueCredits(uint256 projectId)",
  "function getProject(uint256 projectId) view returns (tuple(uint256 id, string name, uint8 ecosystem, string location, uint256 areaHaScaled, address owner, string docHash, uint8 status, string mrvReportHash, string verifierNote, bool creditsIssued, uint256 creditsAmount, uint256 registeredAt))",
  "function projectCount() view returns (uint256)",
  "function addVerifier(address account)",
  "function addOracle(address account)",
  "event ProjectRegistered(uint256 indexed id, address indexed owner, string name, uint8 ecosystem, uint256 areaHaScaled)",
  "event CreditsIssued(uint256 indexed id, address indexed to, uint256 amount)",
];

const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function totalRetired() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function burn(uint256 amount)",
];

let provider, oracleWallet, registry, token;

function init() {
  if (registry) return { provider, oracleWallet, registry, token };

  provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

  // The backend acts as the MRV "oracle": it computes automated verification
  // results off-chain (services/mrvEngine.js) and submits the pass/fail
  // result on-chain via submitMrvResult(). It never signs on a user's behalf
  // for anything financial -- credit issuance is restricted to the
  // regulator/owner key, and transfers/retirement are meant to be signed by
  // the project owner's own MetaMask wallet from the frontend.
  oracleWallet = new ethers.Wallet(process.env.BACKEND_ORACLE_PRIVATE_KEY, provider);

  registry = new ethers.Contract(process.env.REGISTRY_CONTRACT_ADDRESS, REGISTRY_ABI, oracleWallet);
  token = new ethers.Contract(process.env.CREDIT_TOKEN_ADDRESS, TOKEN_ABI, provider);

  return { provider, oracleWallet, registry, token };
}

const ECOSYSTEM_INDEX = { mangrove: 0, seagrass: 1, saltmarsh: 2 };

async function registerProjectOnChain({ name, ecosystem, location, areaHa, docHash, projectOwner }) {
  const { registry } = init();
  const areaHaScaled = Math.round(Number(areaHa) * 100);
  const tx = await registry.registerProject(name, ECOSYSTEM_INDEX[ecosystem], location, areaHaScaled, docHash || "", projectOwner);
  const receipt = await tx.wait();

  // Pull the on-chain project id out of the ProjectRegistered event -- every
  // later call (submitMrvResult, verifierDecision, issueCredits) is keyed by
  // this numeric id, so losing it here would silently break the rest of the
  // on-chain flow.
  let chainProjectId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = registry.interface.parseLog(log);
      if (parsed?.name === "ProjectRegistered") {
        chainProjectId = Number(parsed.args.id);
        break;
      }
    } catch {
      // log from a different contract/topic -- ignore
    }
  }

  return { txHash: receipt.hash, chainProjectId };
}

async function submitMrvResultOnChain({ chainProjectId, passed, reportHash }) {
  const { registry } = init();
  const tx = await registry.submitMrvResult(chainProjectId, passed, reportHash || "");
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function verifierDecisionOnChain({ chainProjectId, approve, note }) {
  const { registry } = init();
  const tx = await registry.verifierDecision(chainProjectId, approve, note || "");
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function issueCreditsOnChain({ chainProjectId }) {
  const { registry } = init();
  const tx = await registry.issueCredits(chainProjectId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

async function getBalance(address) {
  const { token } = init();
  const bal = await token.balanceOf(address);
  return Number(bal);
}

module.exports = {
  init,
  registerProjectOnChain,
  submitMrvResultOnChain,
  verifierDecisionOnChain,
  issueCreditsOnChain,
  getBalance,
};
