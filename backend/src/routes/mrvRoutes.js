const express = require("express");
const { runAutomatedMrv, verifierDecision } = require("../controllers/mrvController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.post("/:projectId/run", requireRole("verifier", "regulator"), runAutomatedMrv);
router.post("/:projectId/decision", requireRole("verifier"), verifierDecision);

module.exports = router;
