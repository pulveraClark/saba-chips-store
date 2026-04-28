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

exports.id = "005_chat_images";

exports.up = async () => {
  await ensureColumn("chat_messages", "image VARCHAR(255) NULL");
};
