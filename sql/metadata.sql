CREATE TABLE IF NOT EXISTS metadata (
    url TEXT PRIMARY KEY,
    siteName TEXT,
    icon TEXT,
    title TEXT,
    description TEXT,
    image TEXT,
    type TEXT,
    accent TEXT,
    cacheDate TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);