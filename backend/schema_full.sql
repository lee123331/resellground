-- ResellGround 전체 스키마

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user',
  seller_grade TEXT DEFAULT '일반',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  seller_email TEXT NOT NULL DEFAULT '',
  seller_name TEXT NOT NULL DEFAULT '익명',
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  condition TEXT DEFAULT '',
  trade_method TEXT DEFAULT '',
  description TEXT DEFAULT '',
  images TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT '판매중',
  view_count INTEGER DEFAULT 0,
  interest INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  board TEXT DEFAULT 'RESELL TALK',
  badge TEXT DEFAULT 'RESELL TALK',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  preview TEXT DEFAULT '',
  author TEXT DEFAULT '익명',
  author_email TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author TEXT DEFAULT '익명',
  author_email TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_email, post_id)
);

CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_en TEXT NOT NULL,
  name_ko TEXT DEFAULT '',
  search_keywords TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  depth INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);
