CREATE TABLE IF NOT EXISTS identifiers (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    date TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);