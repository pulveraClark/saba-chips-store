const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const { getAllUsers, updateUser, deleteUser } = require("../controllers/adminController");

// PROTECTED: Login + Admin only
router.get("/users", isAuthenticated, isAdmin, getAllUsers);
router.put("/users/:id", isAuthenticated, isAdmin, updateUser);
router.delete("/users/:id", isAuthenticated, isAdmin, deleteUser);

module.exports = router;