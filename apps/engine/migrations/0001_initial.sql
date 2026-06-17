CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  poll_interval_minutes INTEGER NOT NULL DEFAULT 30,
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  tickers TEXT NOT NULL DEFAULT '[]',
  metadata TEXT NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'other',
  keywords TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  direction TEXT NOT NULL,
  confidence REAL NOT NULL,
  horizon TEXT NOT NULL,
  rationale TEXT NOT NULL,
  decay_hours INTEGER NOT NULL,
  score_breakdown TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  signal_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  action TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  rationale TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  recommendation_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  modified_quantity INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingest_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  fetched INTEGER NOT NULL,
  new_events INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO sources (id, name, kind, url, enabled, poll_interval_minutes, metadata)
VALUES
  ('fed-press', 'Federal Reserve Press Releases', 'rss', 'https://www.federalreserve.gov/feeds/press_all.xml', 1, 30, '{}'),
  ('sec-aapl', 'Apple SEC Filings', 'sec-edgar', '', 1, 60, '{"cik":"0000320193"}');
