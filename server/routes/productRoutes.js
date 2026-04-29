const express = require("express");
const router = express.Router();

const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getAllProducts,
  getProductById,
  getTopSellingProducts,
  createProduct,
  updateProduct,
  restockProduct,
  deleteProduct
} = require("../controllers/productController");

// Public: users can view products
router.get("/top-selling", getTopSellingProducts);
router.get("/:id", getProductById);
router.get("/", getAllProducts);

// Admin-only
router.post("/", isAuthenticated, isAdmin, upload.single("image"), createProduct);
router.patch("/:id/restock", isAuthenticated, isAdmin, restockProduct);
router.put("/:id", isAuthenticated, isAdmin, upload.single("image"), updateProduct);
router.delete("/:id", isAuthenticated, isAdmin, deleteProduct);

module.exports = router;
