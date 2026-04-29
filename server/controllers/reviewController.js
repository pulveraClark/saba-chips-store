const queryAsync = require("../utils/queryAsync");

exports.createReview = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { orderId, productId, rating, comment = "" } = req.body;
    const numericRating = Number(rating);
    const image = req.file?.storageUrl || null;

    if (!orderId || !productId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "A 1 to 5 rating is required" });
    }

    const eligibleRows = await queryAsync(
      `SELECT o.id
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
       LIMIT 1`,
      [orderId, userId, productId]
    );

    if (!eligibleRows.length) {
      return res.status(403).json({ message: "Only delivered purchased products can be reviewed" });
    }

    await queryAsync(
      `INSERT INTO product_reviews (user_id, order_id, product_id, rating, comment, image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, orderId, productId, numericRating, comment.trim(), image]
    );

    res.status(201).json({ message: "Review submitted" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "You already reviewed this product for this order" });
    }

    console.error("Failed to create review:", err);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await queryAsync(
      `SELECT pr.id, pr.rating, pr.comment, pr.image, pr.created_at, u.name AS customer_name
       FROM product_reviews pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.product_id = ?
       ORDER BY pr.created_at DESC, pr.id DESC
       LIMIT 20`,
      [req.params.productId]
    );

    res.json({ reviews });
  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

exports.getAdminReviews = async (req, res) => {
  try {
    const reviews = await queryAsync(
      `SELECT
         pr.id,
         pr.rating,
         pr.comment,
         pr.image,
         pr.created_at,
         pr.order_id,
         p.id AS product_id,
         p.name AS product_name,
         u.name AS customer_name,
         u.email AS customer_email
       FROM product_reviews pr
       JOIN products p ON pr.product_id = p.id
       JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC, pr.id DESC
       LIMIT 50`
    );

    res.json({ reviews });
  } catch (err) {
    console.error("Failed to fetch admin reviews:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};
