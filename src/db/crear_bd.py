import sqlite3
import os
import sys
import hashlib

db_dir = os.path.dirname(__file__)
db_path = os.path.join(db_dir, 'basededatos.db')
sql_file = os.path.join(db_dir, 'BalatroNightDB.sql')

users_data = [
    {'username': 'player1', 'email': 'player1@example.com', 'password': 'player1', 'admin': 0, 'score': 2850},
    {'username': 'player2', 'email': 'player2@example.com', 'password': 'player2', 'admin': 0, 'score': 2650},
    {'username': 'player3', 'email': 'player3@example.com', 'password': 'player3', 'admin': 0, 'score': 2400},
    {'username': 'player4', 'email': 'player4@example.com', 'password': 'player4', 'admin': 0, 'score': 2150},
    {'username': 'player5', 'email': 'player5@example.com', 'password': 'player5', 'admin': 0, 'score': 1900},
    {'username': 'player6', 'email': 'player6@example.com', 'password': 'player6', 'admin': 0, 'score': 1650},
    {'username': 'player7', 'email': 'player7@example.com', 'password': 'player7', 'admin': 0, 'score': 1400},
    {'username': 'player8', 'email': 'player8@example.com', 'password': 'player8', 'admin': 0, 'score': 1150},
    {'username': 'player9', 'email': 'player9@example.com', 'password': 'player9', 'admin': 0, 'score': 900},
    {'username': 'admin_user', 'email': 'admin@example.com', 'password': 'admin_user', 'admin': 1, 'score': 650},
]

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def crear_base_datos(auto=False):
    if os.path.exists(db_path):
        if not auto:
            respuesta = input("La base de datos ya existe. ¿Borrar y recrear? (s/N): ").lower()
            if respuesta != 's':
                return False
        else:
            return True
        os.remove(db_path)

    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_commands = f.read()

        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.executescript(sql_commands)

        for i, user in enumerate(users_data, 1):
            conn.execute(
                'INSERT INTO saved_games (score, hands_left, discards_left, money, actual_hand, played_cards, num_played_cards) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (0, 4, 4, 10, '[]', '[]', 9)
            )

            password_hash = hash_password(user['password'])
            conn.execute(
                'INSERT INTO users (username, email, password_hash, admin, save_game) VALUES (?, ?, ?, ?, ?)',
                (user['username'], user['email'], password_hash, user['admin'], i)
            )

            conn.execute(
                'INSERT INTO leaderboard (user_id, max_score) VALUES (?, ?)',
                (i, user['score'])
            )

        conn.commit()
        conn.close()
        return True

    except Exception as e:
        if os.path.exists(db_path):
            os.remove(db_path)
        return False

if __name__ == '__main__':
    success = crear_base_datos()
    sys.exit(0 if success else 1)
