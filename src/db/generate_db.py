import sqlite3
import os

db_dir = os.path.dirname(__file__)
db_path = os.path.join(db_dir, 'basededatos.db')
sql_file = os.path.join(db_dir, 'BalatroNightDB.sql')

if not os.path.exists(db_path):
    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_commands = f.read()
        conn = sqlite3.connect(db_path)
        conn.executescript(sql_commands)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        conn.delete(db_path)
        


   