const express = require("express");
const { register, login, me, linkWallet } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/wallet", requireAuth, linkWallet);

module.exports = router;
