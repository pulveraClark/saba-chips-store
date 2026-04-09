const express = require("express");
const router = express.Router();

const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

// Public: users can view products
router.get("/", getAllProducts);

// Admin-only
router.post("/", isAuthenticated, isAdmin, upload.single("image"), createProduct);
router.put("/:id", isAuthenticated, isAdmin, upload.single("image"), updateProduct);
router.delete("/:id", isAuthenticated, isAdmin, deleteProduct);

module.exports = router;