const queryAsync = require("./queryAsync");
const { notifyAdmin } = require("./realtimeData");

const notifyLowStockProducts = async (productIds = []) => {
  const params = productIds.length ? productIds : [];
  const where = productIds.length ? `WHERE id IN (${productIds.map(() => "?").join(",")})` : "";

  const products = await queryAsync(
    `SELECT id, name, stock FROM products ${where}`,
    params
  );

  await Promise.all(
    products
      .filter((product) => Number(product.stock) <= 5)
      .map((product) =>
        notifyAdmin({
          type: Number(product.stock) <= 0 ? "error" : "warning",
          title: Number(product.stock) <= 0 ? "Product out of stock" : "Low stock alert",
          message:
            Number(product.stock) <= 0
              ? `${product.name} is out of stock.`
              : `${product.name} has only ${product.stock} item(s) left.`,
          link: "/admin-products",
        })
      )
  );
};

module.exports = notifyLowStockProducts;
