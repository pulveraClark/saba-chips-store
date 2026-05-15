const realtimeMigration = require("../migrations/001_realtime_and_profile_tables");
const userRolesMigration = require("../migrations/002_user_roles");
const wishlistReviewsMigration = require("../migrations/003_wishlist_reviews");
const realStoreWorkflowsMigration = require("../migrations/004_real_store_workflows");
const chatImagesMigration = require("../migrations/005_chat_images");
const productionInfrastructureMigration = require("../migrations/006_production_infrastructure");
const deliveryFeeMigration = require("../migrations/007_delivery_fee");
const queryAsync = require("./queryAsync");

const migrations = [
  realtimeMigration,
  userRolesMigration,
  wishlistReviewsMigration,
  realStoreWorkflowsMigration,
  chatImagesMigration,
  productionInfrastructureMigration,
  deliveryFeeMigration,
];

const runMigrations = async () => {
  await queryAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(190) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const rows = await queryAsync("SELECT id FROM schema_migrations");
  const executed = new Set(rows.map((row) => row.id));

  for (const migration of migrations) {
    if (executed.has(migration.id)) {
      continue;
    }

    await migration.up();
    await queryAsync("INSERT INTO schema_migrations (id) VALUES (?)", [migration.id]);
  }
};

module.exports = runMigrations;
