from werkzeug.security import generate_password_hash, check_password_hash
from py.database import db
from py.models import User, SavedGame, Leaderboard
from flask import request, jsonify, session
import re
import hashlib

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def verify_password(stored_hash, password):
    if stored_hash.startswith('pbkdf2:'):
        return check_password_hash(stored_hash, password)
    else:
        return stored_hash == hashlib.sha256(password.encode()).hexdigest()

def login():
    try:
        if not request.is_json:
            return jsonify({'success': False, 'message': 'Content-Type debe ser application/json'}), 400
        
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Usuario y contraseña requeridos'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        
        if not verify_password(user.password_hash, password):
            return jsonify({'success': False, 'message': 'Contraseña incorrecta'}), 401
        
        session['user_id'] = user.id
        session['username'] = user.username
        session['admin'] = user.admin
        
        return jsonify({
            'success': True,
            'message': 'Login exitoso',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'admin': bool(user.admin)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en login: {str(e)}'}), 500

def register():
    try:
        if not request.is_json:
            return jsonify({'success': False, 'message': 'Content-Type debe ser application/json'}), 400
        
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not username or not email or not password:
            return jsonify({'success': False, 'message': 'Todos los campos son requeridos'}), 400
        
        if len(username) < 3:
            return jsonify({'success': False, 'message': 'El usuario debe tener al menos 3 caracteres'}), 400
        
        if len(password) < 6:
            return jsonify({'success': False, 'message': 'La contraseña debe tener al menos 6 caracteres'}), 400
        
        if not is_valid_email(email):
            return jsonify({'success': False, 'message': 'Email inválido'}), 400
        
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        
        if existing_user:
            return jsonify({'success': False, 'message': 'Usuario o email ya existe'}), 409
        
        new_saved_game = SavedGame(
            score=0,
            hands_left=4,
            discards_left=4,
            money=0,
            actual_hand='[]',
            played_cards='[]',
            num_played_cards=9
        )
        db.session.add(new_saved_game)
        db.session.flush()
        
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            admin=0,
            save_game=new_saved_game.id
        )
        db.session.add(new_user)
        db.session.flush()
        
        new_leaderboard = Leaderboard(
            user_id=new_user.id,
            max_score=0
        )
        db.session.add(new_leaderboard)
        db.session.commit()
        
        session['user_id'] = new_user.id
        session['username'] = new_user.username
        session['admin'] = new_user.admin
        
        return jsonify({
            'success': True,
            'message': 'Registro exitoso',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'admin': bool(new_user.admin)
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error en registro: {str(e)}'}), 500

def logout():
    try:
        session.clear()
        return jsonify({'success': True, 'message': 'Sesión cerrada'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error cerrando sesión: {str(e)}'}), 500

def verificar_sesion():
    try:
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                return jsonify({
                    'logged_in': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'admin': bool(user.admin)
                    }
                }), 200
        
        return jsonify({'logged_in': False}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error verificando sesión: {str(e)}'}), 500

def verificar_partida_guardada():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'No hay sesión activa'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or not user.saved_game:
            return jsonify({'success': True, 'has_saved_game': False}), 200
        
        saved_game = user.saved_game
        
        # ✅ Cambiar: mostrar partida guardada si la ronda es mayor a 1 (no es una nueva partida) o si hay dinero acumulado
        if saved_game.round > 1 or saved_game.money > 0:
            return jsonify({
                'success': True,
                'has_saved_game': True,
                'game_info': {
                    'score': saved_game.score,
                    'hands_left': saved_game.hands_left,
                    'discards_left': saved_game.discards_left,
                    'money': saved_game.money
                }
            }), 200
        else:
            return jsonify({'success': True, 'has_saved_game': False}), 200
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def leaderboard():
    try:
        top_players = db.session.query(User.username, Leaderboard.max_score).join(
            Leaderboard, User.id == Leaderboard.user_id
        ).order_by(Leaderboard.max_score.desc()).limit(10).all()
        
        leaderboard_data = [{'username': username, 'score': score} for username, score in top_players]
        
        return jsonify({'success': True, 'leaderboard': leaderboard_data}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
