CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('researcher', 'public', 'reviewer', 'admin')),
  institution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  category_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS research_submissions (
  submission_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(category_id),
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  source_type TEXT DEFAULT 'contributed' CHECK(source_type IN ('contributed', 'aggregated')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected', 'revision_requested')),
  shareable_link TEXT UNIQUE,
  flagged INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS peer_reviews (
  review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL REFERENCES research_submissions(submission_id),
  reviewer_id INTEGER NOT NULL REFERENCES users(user_id),
  decision TEXT NOT NULL CHECK(decision IN ('verified', 'rejected', 'revision_requested')),
  comments TEXT,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS external_sources (
  source_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  last_indexed_at DATETIME,
  submission_id TEXT REFERENCES research_submissions(submission_id)
);

CREATE TABLE IF NOT EXISTS research_requests (
  request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'prioritized', 'addressed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
  vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES research_requests(request_id),
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(request_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  submission_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_status ON research_submissions(status);
CREATE INDEX IF NOT EXISTS idx_sub_cat ON research_submissions(category_id);
CREATE INDEX IF NOT EXISTS idx_sub_link ON research_submissions(shareable_link);
CREATE INDEX IF NOT EXISTS idx_req_votes ON research_requests(vote_count DESC);
