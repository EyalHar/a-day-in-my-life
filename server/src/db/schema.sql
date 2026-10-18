CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('photo', 'note', 'thought', 'recipe', 'commitment', 'plan', 'dream', 'other')),
  title TEXT,
  text TEXT,
  url TEXT,
  recurrence TEXT,
  recurrence_until TEXT,
  recurrence_count INTEGER,
  tehillim_chapters TEXT,
  tehillim_plan TEXT,
  is_private INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);

CREATE TABLE IF NOT EXISTS entry_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_entry_photos_entry_id ON entry_photos(entry_id);

CREATE TABLE IF NOT EXISTS entry_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(entry_id, date)
);

CREATE INDEX IF NOT EXISTS idx_entry_completions_entry_date ON entry_completions(entry_id, date);

CREATE TABLE IF NOT EXISTS tehillim_reads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(entry_id, date, chapter)
);

CREATE TABLE IF NOT EXISTS day_covers (
  date TEXT PRIMARY KEY,
  photo_id INTEGER NOT NULL REFERENCES entry_photos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  private_password_hash TEXT,
  reminders_enabled INTEGER NOT NULL DEFAULT 0,
  -- NULL start/end = remind all day
  reminder_start TEXT,
  reminder_end TEXT
);
