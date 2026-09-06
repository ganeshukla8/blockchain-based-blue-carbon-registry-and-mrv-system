const Project = require("../models/Project");
const Transaction = require("../models/Transaction");
const chain = require("../services/blockchain");

// POST /api/credits/:projectId/issue  (role: regulator)
// This is an administrative/oracle-signed action -> the backend signs it, mirroring
// onlyOwner on BlueCarbonRegistry.issueCredits(). Transfers and retirement, by
// contrast, must be signed by the credit HOLDER's own wallet (see recordTransaction
// below) since only they can move or burn tokens they own.
exports.issueCredits = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.mrvStatus !== "Verifier Approved") {
      return res.status(400).json({ message: "Project must be Verifier Approved before credits can be issued" });
    }
    if (project.creditsIssued) {
      return res.status(400).json({ message: "Credits already issued for this project" });
    }

    const RATES = { mangrove: 6.2, seagrass: 3.7, saltmarsh: 2.9 };
    const amount = Math.round(project.areaHa * RATES[project.ecosystem]);

    if (process.env.REQUIRE_BLOCKCHAIN === "true" && !(process.env.REGISTRY_CONTRACT_ADDRESS && project.chainProjectId)) {
      return res.status(503).json({ message: "Blockchain is required for credit issuance" });
    }

    let txHash = `off-chain-${Date.now()}`;
    if (process.env.REGISTRY_CONTRACT_ADDRESS && project.chainProjectId) {
      try {
        const result = await chain.issueCreditsOnChain({ chainProjectId: project.chainProjectId });
        txHash = result.txHash;
      } catch (chainErr) {
        if (process.env.REQUIRE_BLOCKCHAIN === "true") throw chainErr;
        console.warn("On-chain credit issuance skipped:", chainErr.message);
      }
    }

    project.creditsIssued = true;
    project.creditsAmount = amount;
    project.txHashes.issuance = txHash;
    await project.save();

    await Transaction.create({
      type: "Issuance",
      project: project._id,
      from: null,
      to: project.ownerWallet,
      amount,
      txHash,
    });

    res.json({ project, amount, txHash });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/credits/transactions  body: { type, projectId?, from?, to, amount, txHash }
// The FRONTEND calls this immediately after it executes a transfer() or burn()
// directly against the CarbonCreditToken contract via the user's own MetaMask
// signer. The backend never holds a user's private key -- it only records the
// resulting on-chain (or off-chain-simulated, if chain isn't configured) event
// for the activity feed and dashboard totals.
exports.recordTransaction = async (req, res) => {
  try {
    const { type, projectId, from, to, amount, txHash } = req.body;
    if (!["Transfer", "Retirement"].includes(type)) {
      return res.status(400).json({ message: "type must be Transfer or Retirement" });
    }
    if (!amount || !txHash) return res.status(400).json({ message: "amount and txHash are required" });

    const tx = await Transaction.create({
      type,
      project: projectId || null,
      from: from || null,
      to: type === "Retirement" ? null : to,
      amount,
      txHash,
    });
    res.status(201).json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/credits/transactions
exports.listTransactions = async (req, res) => {
  const txs = await Transaction.find().sort({ createdAt: -1 }).limit(200);
  res.json({ transactions: txs });
};

// GET /api/credits/balance/:address
exports.getBalance = async (req, res) => {
  const address = req.params.address;

  if (process.env.REGISTRY_CONTRACT_ADDRESS) {
    try {
      const balance = await chain.getBalance(address);
      return res.json({ address, balance, source: "chain" });
    } catch (chainErr) {
      console.warn("On-chain balance read failed, falling back to ledger sum:", chainErr.message);
    }
  }

  // Fallback: derive balance by summing recorded transactions (off-chain / dev mode)
  const [issued, received, sentOrRetired] = await Promise.all([
    Transaction.aggregate([{ $match: { to: address, type: "Issuance" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
    Transaction.aggregate([{ $match: { to: address, type: "Transfer" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
    Transaction.aggregate([{ $match: { from: address, type: { $in: ["Transfer", "Retirement"] } } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
  ]);
  const balance = (issued[0]?.sum || 0) + (received[0]?.sum || 0) - (sentOrRetired[0]?.sum || 0);
  res.json({ address, balance, source: "ledger-sum" });
};
