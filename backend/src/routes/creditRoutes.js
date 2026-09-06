const express = require("express");
const { issueCredits, recordTransaction, listTransactions, getBalance } = require("../controllers/creditController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.post("/:projectId/issue", requireRole("regulator"), issueCredits);
router.post("/transactions", recordTransaction);
router.get("/transactions", listTransactions);
router.get("/balance/:address", getBalance);

module.exports = router;
