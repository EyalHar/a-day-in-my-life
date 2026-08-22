const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'journal.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const entryColumns = db.prepare('PRAGMA table_info(entries)').all().map((c) => c.name);
if (!entryColumns.includes('url')) {
  db.exec('ALTER TABLE entries ADD COLUMN url TEXT');
}
if (!entryColumns.includes('recurrence')) {
  db.exec('ALTER TABLE entries ADD COLUMN recurrence TEXT');
}
if (!entryColumns.includes('recurrence_until')) {
  db.exec('ALTER TABLE entries ADD COLUMN recurrence_until TEXT');
}

db.prepare('INSERT OR IGNORE INTO app_settings (id, private_password_hash) VALUES (1, NULL)').run();

module.exports = db;
