const queryAsync = require("../utils/queryAsync");
const { ADMIN_EMAIL } = require("../utils/realtimeData");

const ensureUserColumn = async (definition) => {
  try {
    await queryAsync(`ALTER TABLE users ADD COLUMN ${definition}`);
  } catch (err) {
    if (err.code !== "ER_DUP_FIELDNAME") {
      throw err;
    }
  }
};

exports.id = "002_user_roles";

exports.up = async () => {
  await ensureUserColumn("role VARCHAR(30) NOT NULL DEFAULT 'customer'");
  await queryAsync("UPDATE users SET role = 'admin' WHERE email = ?", [ADMIN_EMAIL]);
};
