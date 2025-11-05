"""
Rutas de autenticación (login, registro, logout)
"""
from flask import Blueprint, request, jsonify, session
import hashlib
from py.database import get_db_connection

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """Hashea la contraseña usando SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

@auth_bp.route('/login', methods=['POST'])
def login():
    """Procesar login de usuario"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Usuario y contraseña requeridos'})
        
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'})
        
        password_hash = hash_password(password)
        if user['password_hash'] != password_hash:
            return jsonify({'success': False, 'message': 'Contraseña incorrecta'})
        
        # Guardar sesión
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['admin'] = user['admin']
        
        return jsonify({
            'success': True,
            'message': 'Login exitoso',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'admin': bool(user['admin'])
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en login: {str(e)}'})

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'success': False, 'message': 'Todos los campos son requeridos'})
        
        if len(username) < 3:
            return jsonify({'success': False, 'message': 'El usuario debe tener al menos 3 caracteres'})
        
        if len(password) < 6:
            return jsonify({'success': False, 'message': 'La contraseña debe tener al menos 6 caracteres'})
        
        conn = get_db_connection()
        
        existing_user = conn.execute('SELECT id FROM users WHERE username = ? OR email = ?', 
                                     (username, email)).fetchone()
        if existing_user:
            conn.close()
            return jsonify({'success': False, 'message': 'Usuario o email ya registrado'})
        
        password_hash = hash_password(password)
        
        cursor = conn.execute('''
            INSERT INTO saved_games (score, hands_left, discards_left, money, actual_hand, played_cards, num_played_cards)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (0, 4, 4, 10, '[]', '[]', 9))
        game_id = cursor.lastrowid
        
        cursor = conn.execute('INSERT INTO users (username, email, password_hash, admin, save_game) VALUES (?, ?, ?, ?, ?)',
                             (username, email, password_hash, 0, game_id))
        user_id = cursor.lastrowid
        
        conn.execute('INSERT INTO leaderboard (user_id, max_score) VALUES (?, ?)', (user_id, 0))
        
        conn.commit()
        conn.close()
        
        session['user_id'] = user_id
        session['username'] = username
        session['admin'] = 0
        
        return jsonify({
            'success': True,
            'message': 'Registro exitoso',
            'user': {
                'id': user_id,
                'username': username,
                'admin': False
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en registro: {str(e)}'})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Cerrar sesión"""
    session.clear()
    return jsonify({'success': True, 'message': 'Sesión cerrada'})

@auth_bp.route('/verificar_sesion', methods=['GET'])
def verificar_sesion():
    """Verificar si hay sesión activa"""
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'user': {
                'id': session['user_id'],
                'username': session.get('username'),
                'admin': session.get('admin', False)
            }
        })
    return jsonify({'logged_in': False})

@auth_bp.route('/verificar_partida_guardada', methods=['GET'])
def verificar_partida_guardada():
    """Verificar si el usuario tiene una partida guardada"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'No hay sesión activa'})
    
    try:
        conn = get_db_connection()
        saved_game = conn.execute('''
            SELECT score, hands_left, discards_left, money 
            FROM saved_games 
            WHERE user_id = ?
        ''', (session['user_id'],)).fetchone()
        conn.close()
        
        if saved_game and saved_game['score'] > 0:
            return jsonify({
                'success': True,
                'has_saved_game': True,
                'game_info': {
                    'score': saved_game['score'],
                    'hands_left': saved_game['hands_left'],
                    'discards_left': saved_game['discards_left'],
                    'money': saved_game['money']
                }
            })
        else:
            return jsonify({
                'success': True,
                'has_saved_game': False
            })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@auth_bp.route('/leaderboard', methods=['GET'])
def leaderboard():
    """Obtener el top 10 del leaderboard"""
    try:
        conn = get_db_connection()
        top_players = conn.execute('''
            SELECT u.username, l.max_score
            FROM leaderboard l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.max_score DESC
            LIMIT 10
        ''').fetchall()
        conn.close()
        
        leaderboard_data = [
            {
                'username': player['username'],
                'score': player['max_score']
            }
            for player in top_players
        ]
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard_data
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
