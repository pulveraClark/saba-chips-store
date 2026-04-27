const queryAsync = require("./queryAsync");

const getTopSellingProducts = async (limit = 5) => {
  const normalizedLimit = Math.max(1, Math.min(Number(limit) || 5, 20));

  return queryAsync(
    `SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     GROUP BY p.id, p.name, p.description, p.price, p.stock, p.image
     ORDER BY total_quantity DESC, p.name ASC
     LIMIT ?`,
    [normalizedLimit]
  );
};

module.exports = getTopSellingProducts;
