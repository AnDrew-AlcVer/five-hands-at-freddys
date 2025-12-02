from flask import Flask, render_template, send_from_directory, session, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys

load_dotenv()
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'db'))

try:
    from db.crear_bd import crear_base_datos
except ImportError:
    crear_base_datos = None

from py.database import init_db
from py.login import (login, register, logout, verificar_sesion,
                      verificar_partida_guardada, leaderboard)
from py.juego import (inicializar_juego, robar_cartas, jugar_cartas,
                      descartar_cartas, obtener_jokers_tienda, comprar_joker,
                      guardar_partida, obtener_ultima_partida, require_session,
                      obtener_objetivos, validar_ronda, borrar_partida_guardada)

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'clave_por_defecto_no_usar_en_produccion')
CORS(app, supports_credentials=True)

init_db(app)

db_path = os.path.join(os.path.dirname(__file__), 'db', 'basededatos.db')
if not os.path.exists(db_path) and crear_base_datos:
    try:
        crear_base_datos(auto=True)
    except Exception as e:
        pass

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static', 'img'), 'favicon.gif', mimetype='image/gif')

@app.route('/templates/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(app.root_path, 'templates', 'css'), filename, mimetype='text/css')

@app.route('/')
def index():
    if 'user_id' not in session:
        return render_template('html/login.html')
    return render_template('html/menu.html')

@app.route('/login', methods=['GET'])
def login_page():
    return render_template('html/login.html')

@app.route('/menu', methods=['GET'])
def menu():
    if 'user_id' not in session:
        return render_template('html/login.html')
    return render_template('html/menu.html')

@app.route('/juego', methods=['GET'])
def juego():
    if 'user_id' not in session:
        return render_template('html/login.html')
    return render_template('html/juego.html')

@app.route('/baraja', methods=['GET'])
def baraja():
    if 'user_id' not in session:
        return render_template('html/login.html')
    return render_template('html/baraja.html')

@app.route('/admin', methods=['GET'])
def admin():
    return render_template('html/admin.html')

@app.route('/auth/login', methods=['POST'])
def auth_login():
    return login()

@app.route('/auth/register', methods=['POST'])
def auth_register():
    return register()

@app.route('/auth/logout', methods=['POST'])
def auth_logout():
    return logout()

@app.route('/auth/verificar_sesion', methods=['GET'])
def auth_verificar_sesion():
    return verificar_sesion()

@app.route('/auth/verificar_partida_guardada', methods=['GET'])
def auth_verificar_partida_guardada():
    return verificar_partida_guardada()

@app.route('/auth/leaderboard', methods=['GET'])
def auth_leaderboard():
    return leaderboard()

@app.route('/game/inicializar_juego', methods=['POST'])
@require_session
def game_inicializar():
    return inicializar_juego()

@app.route('/game/robar_cartas', methods=['POST'])
@require_session
def game_robar():
    return robar_cartas()

@app.route('/game/jugar_cartas', methods=['POST'])
@require_session
def game_jugar():
    return jugar_cartas()

@app.route('/game/descartar_cartas', methods=['POST'])
@require_session
def game_descartar():
    return descartar_cartas()

@app.route('/game/obtener_jokers_tienda', methods=['POST'])
@require_session
def game_obtener_jokers():
    return obtener_jokers_tienda()

@app.route('/game/comprar_joker', methods=['POST'])
@require_session
def game_comprar():
    return comprar_joker()

@app.route('/game/guardar_partida', methods=['POST'])
@require_session
def game_guardar():
    return guardar_partida()

@app.route('/game/obtener_ultima_partida', methods=['GET'])
@require_session
def game_obtener_ultima():
    return obtener_ultima_partida()

@app.route('/game/obtener_objetivos', methods=['GET'])
@require_session
def game_obtener_objetivos():
    return obtener_objetivos()

@app.route('/game/validar_ronda', methods=['POST'])
@require_session
def game_validar_ronda():
    data = request.get_json() or {}
    numero_ronda = data.get('numero_ronda')
    puntuacion = data.get('puntuacion')
    return validar_ronda(numero_ronda, puntuacion)

@app.route('/game/borrar_partida_guardada', methods=['POST'])
@require_session
def game_borrar_partida():
    return borrar_partida_guardada()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
