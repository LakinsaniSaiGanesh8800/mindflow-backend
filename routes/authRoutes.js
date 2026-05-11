const express = require("express");
const router = express.Router();
const { signup, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected route — verify token & return current user
router.get("/me", authMiddleware, getMe);

module.exports = router;