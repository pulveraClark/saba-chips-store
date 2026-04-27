const queryAsync = require("../utils/queryAsync");

exports.getWishlist = async (req, res) => {
  try {
    const rows = await queryAsync(
      `SELECT product_id FROM wishlists WHERE user_id = ? ORDER BY created_at DESC`,
      [req.session.userId]
    );
    res.json({ productIds: rows.map((row) => row.product_id) });
  } catch (err) {
    console.error("Failed to fetch wishlist:", err);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

exports.addWishlistItem = async (req, res) => {
  try {
    await queryAsync(
      "INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)",
      [req.session.userId, req.params.productId]
    );
    res.status(201).json({ message: "Added to wishlist" });
  } catch (err) {
    console.error("Failed to add wishlist item:", err);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
};

exports.removeWishlistItem = async (req, res) => {
  try {
    await queryAsync(
      "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?",
      [req.session.userId, req.params.productId]
    );
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    console.error("Failed to remove wishlist item:", err);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
};
