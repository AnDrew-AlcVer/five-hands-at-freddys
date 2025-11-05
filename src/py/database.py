"""
Utilidades de base de datos
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'db', 'basededatos.db')

def get_db_connection():
    """Obtiene conexión a la base de datos con foreign keys habilitadas"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
