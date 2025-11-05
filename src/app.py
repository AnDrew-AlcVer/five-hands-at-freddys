from flask import Flask, render_template, send_from_directory, session
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sys

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'db'))
from crear_bd import crear_base_datos

db_path = os.path.join(os.path.dirname(__file__), 'db', 'basededatos.db')
if not os.path.exists(db_path):
    print("Base de datos no encontrada. Creando base de datos...")
    if crear_base_datos(auto=True):
        print("Base de datos creada exitosamente.")
    else:
        print("Error al crear la base de datos.")
        sys.exit(1)

from py.login import auth_bp
from py.juego import game_bp

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'clave_por_defecto_no_usar_en_produccion')
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(game_bp)


@app.route('/favicon.ico')
def favicon():
    """Servir favicon"""
    return send_from_directory(os.path.join(app.root_path, 'static', 'img'), 'favicon.gif', mimetype='image/gif')

@app.route('/templates/css/<path:filename>')
def serve_css(filename):
    """Servir archivos CSS desde templates/css/"""
    return send_from_directory(os.path.join(app.root_path, 'templates', 'css'), filename, mimetype='text/css')

@app.route('/')
def index():
    """Ruta principal - Redirige a login si no hay sesión, sino muestra el menú"""
    if 'user_id' not in session:
        return render_template('html/login.html')
    return render_template('html/menu.html')

@app.route('/login')
def login():
    """Ruta de login"""
    return render_template('html/login.html')

@app.route('/menu')
def menu():
    """Servir el menú principal (requiere sesión)"""
    if 'user_id' not in session:
        return render_template('html/login.html')
    return render_template('html/menu.html')

@app.route('/juego')
def juego():
    """Servir la página del juego (requiere sesión)"""
    if 'user_id' not in session:
        return render_template('html/login.html')
    return render_template('html/juego.html')

@app.route('/admin')
def admin():
    """Servir la página de administración"""
    return render_template('html/admin.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)