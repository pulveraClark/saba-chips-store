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

exports.id = "007_delivery_fee";

exports.up = async () => {
  await ensureColumn("orders", "delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0");
};
