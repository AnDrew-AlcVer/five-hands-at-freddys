CREATE TABLE `laderboard` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer UNIQUE,
  `max_score` integer DEFAULT 0
);

CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `username` text UNIQUE NOT NULL,
  `email` text UNIQUE NOT NULL,
  `password_hash` text NOT NULL,
  `admin` bool DEFAULT false,
  `save_game` integer UNIQUE
);

CREATE TABLE `saved_games` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `score` integer DEFAULT 0,
  `hands_left` integer DEFAULT 4,
  `discards_left` integer DEFAULT 4,
  `money` integer DEFAULT 0,
  `actual_hand` text NOT NULL,
  `played_cards` text NOT NULL,
  `num_played_cards` integer DEFAULT 9,
  `purchased_jokers` text,
  `open_store` bool DEFAULT false,
  `jokers_store` text
);

ALTER TABLE `users` ADD FOREIGN KEY (`id`) REFERENCES `laderboard` (`user_id`);

ALTER TABLE `saved_games` ADD FOREIGN KEY (`id`) REFERENCES `users` (`save_game`);
