CREATE TABLE saved_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  score INTEGER DEFAULT 0,
  hands_left INTEGER DEFAULT 4,
  discards_left INTEGER DEFAULT 4,
  money INTEGER DEFAULT 0,
  actual_hand TEXT NOT NULL,
  played_cards TEXT NOT NULL,
  num_played_cards INTEGER DEFAULT 9,
  purchased_jokers TEXT,
  open_store INTEGER DEFAULT 0,
  jokers_store TEXT,
  round INTEGER DEFAULT 1,
  blind_target INTEGER DEFAULT 300,
  chips INTEGER DEFAULT 0,
  mult INTEGER DEFAULT 0
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  admin INTEGER DEFAULT 0,
  save_game INTEGER UNIQUE,
  FOREIGN KEY (save_game) REFERENCES saved_games(id) ON DELETE SET NULL
);

CREATE TABLE leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  max_score INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_leaderboard_score ON leaderboard(max_score DESC);
