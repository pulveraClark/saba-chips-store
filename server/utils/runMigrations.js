const realtimeMigration = require("../migrations/001_realtime_and_profile_tables");
const userRolesMigration = require("../migrations/002_user_roles");
const queryAsync = require("./queryAsync");

const migrations = [realtimeMigration, userRolesMigration];

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
