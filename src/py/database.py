"""
Utilidades de base de datos con SQLAlchemy ORM
"""
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

db = SQLAlchemy()

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'db', 'basededatos.db')

def init_db(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        db.create_all()

def get_db_session():
    engine = create_engine(f'sqlite:///{DB_PATH}')
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()

def get_db_connection():
    return get_db_session()
