from py.database import db
from datetime import datetime
import json

class SavedGame(db.Model):
    __tablename__ = 'saved_games'
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.Integer, default=0)
    hands_left = db.Column(db.Integer, default=4)
    discards_left = db.Column(db.Integer, default=4)
    money = db.Column(db.Integer, default=0)
    actual_hand = db.Column(db.Text, nullable=False, default='[]')
    played_cards = db.Column(db.Text, nullable=False, default='[]')
    num_played_cards = db.Column(db.Integer, default=9)
    purchased_jokers = db.Column(db.Text, default=None)
    open_store = db.Column(db.Integer, default=0)
    jokers_store = db.Column(db.Text, default=None)
    round = db.Column(db.Integer, default=1)
    blind_target = db.Column(db.Integer, default=300)
    chips = db.Column(db.Integer, default=0)
    mult = db.Column(db.Integer, default=0)
    user = db.relationship('User', back_populates='saved_game', uselist=False)

    def to_dict(self):
        return {
            'id': self.id, 'score': self.score, 'hands': self.hands_left,
            'discards': self.discards_left, 'money': self.money,
            'actual_hand': self._safe_json_load(self.actual_hand, []),
            'played_cards': self._safe_json_load(self.played_cards, []),
            'num_played_cards': self.num_played_cards,
            'purchased_jokers': self._safe_json_load(self.purchased_jokers, None),
            'open_store': self._safe_json_load(self.jokers_store, None),
            'jokers_store': self._safe_json_load(self.jokers_store, None),
            'round': self._calculate_round_from_score(), 'blindTarget': self.blind_target,
            'chips': self.chips, 'mult': self.mult
        }

    def _calculate_round_from_score(self):
        objectives = [(1, 300), (2, 600), (3, 1000), (4, 1500), (5, 2200), (6, 3000), (7, 4000), (8, 5500)]
        current_round = 1
        for round_num, target in objectives:
            if self.score >= target:
                current_round = round_num + 1
            else:
                break
        return min(current_round, 8)

    def _safe_json_load(self, json_str, default_value):
        if not json_str:
            return default_value
        try:
            return json.loads(json_str)
        except (json.JSONDecodeError, TypeError):
            return default_value

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    admin = db.Column(db.Integer, default=0)
    save_game = db.Column(db.Integer, db.ForeignKey('saved_games.id'), unique=True)
    saved_game = db.relationship('SavedGame', back_populates='user', uselist=False)
    leaderboard_entry = db.relationship('Leaderboard', back_populates='user', uselist=False)

    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'email': self.email, 'admin': bool(self.admin)}

class Leaderboard(db.Model):
    __tablename__ = 'leaderboard'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    max_score = db.Column(db.Integer, default=0)
    user = db.relationship('User', back_populates='leaderboard_entry', uselist=False)

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id, 'max_score': self.max_score,
            'username': self.user.username if self.user else None
        }