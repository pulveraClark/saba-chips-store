const queryAsync = require("../utils/queryAsync");

const ensureColumn = async (table, definition) => {
  try {
    await queryAsync(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") {
      throw err;
    }
  }
};

exports.id = "004_real_store_workflows";

exports.up = async () => {
  await ensureColumn("products", "category VARCHAR(50) NOT NULL DEFAULT 'classic'");
  await ensureColumn("product_reviews", "image VARCHAR(255) NULL");

  await ensureColumn("orders", "delivery_area VARCHAR(120) NULL");
  await ensureColumn("orders", "order_notes TEXT NULL");
  await ensureColumn("orders", "payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid'");
  await ensureColumn("orders", "payment_proof_image VARCHAR(255) NULL");
  await ensureColumn("orders", "payment_reference VARCHAR(120) NULL");
  await ensureColumn("orders", "payment_review_note TEXT NULL");
  await ensureColumn("orders", "payment_reviewed_at DATETIME NULL");

  await queryAsync(`
    ALTER TABLE orders
    MODIFY COLUMN status ENUM(
      'payment_verification',
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'shipped',
      'delivered',
      'cancelled'
    ) NOT NULL DEFAULT 'pending'
  `);
};
