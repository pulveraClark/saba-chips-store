const queryAsync = require("../utils/queryAsync");

exports.id = "003_wishlist_reviews";

exports.up = async () => {
  await queryAsync(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_wishlist_user_product (user_id, product_id),
      INDEX idx_wishlist_user (user_id)
    )
  `);

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      rating TINYINT NOT NULL,
      comment TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_review_order_product_user (order_id, product_id, user_id),
      INDEX idx_reviews_product (product_id),
      INDEX idx_reviews_user (user_id)
    )
  `);
};
