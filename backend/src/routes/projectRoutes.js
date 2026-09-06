const express = require("express");
const multer = require("multer");

const {
  createProject,
  listProjects,
  getProject,
  resubmitProject,
} = require("../controllers/projectController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const router = express.Router();

// All project routes require login
router.use(requireAuth);

// ============================================================
// CREATE PROJECT
// POST /api/projects
// Role: owner
// ============================================================
router.post(
  "/",
  requireRole("owner"),
  upload.single("document"),
  createProject
);

// ============================================================
// LIST PROJECTS
// GET /api/projects
// ============================================================
router.get(
  "/",
  listProjects
);

// ============================================================
// GET SINGLE PROJECT
// GET /api/projects/:id
// ============================================================
router.get(
  "/:id",
  getProject
);

// ============================================================
// RESUBMIT FLAGGED PROJECT
// POST /api/projects/:id/resubmit
// Role: owner
//
// Owner uploads corrected PDF.
// Project changes:
// Flagged for Review → Pending
// ============================================================
router.post(
  "/:id/resubmit",
  requireRole("owner"),
  upload.single("document"),
  resubmitProject
);

module.exports = router;