from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import random
import os
import json

app = Flask(__name__)
CORS(app)

def load_jokers():
    jokers_path = os.path.join(app.root_path, 'data', 'jokers.json')
    with open(jokers_path, 'r', encoding='utf-8') as f:
        return json.load(f)

JOKERS = load_jokers() 

def generate_full_deck():
    """Genera un mazo completo de 52 cartas"""
    suits = ['♠', '♥', '♦', '♣']
    values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    red_suits = {'♥', '♦'}
    
    return [
        {
            'suit': suit,
            'value': value,
            'color': 'red' if suit in red_suits else 'black'
        }
        for suit in suits
        for value in values
    ]

def card_exists_in_list(card, card_list):
    """Verifica si una carta ya existe en una lista"""
    return any(c['suit'] == card['suit'] and c['value'] == card['value'] for c in card_list)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static', 'img'), 'favicon.gif', mimetype='image/gif')

@app.route('/admin')
def admin():
    return render_template('html/admin.html')


@app.route('/')
def index():
    """Servir la página principal"""
    return render_template('html/index.html')

@app.route('/inicializar_juego', methods=['POST'])
def inicializar_juego():
    """Inicializar el juego"""
    try:
        full_deck = generate_full_deck()
        random.shuffle(full_deck)
        
        return jsonify({
            'success': True,
            'hand': full_deck[:9],
            'gameState': {
                'score': 0,
                'hands': 4,
                'discards': 4,
                'money': 10,
                'shopOpened': False
            },
            'message': 'Juego inicializado'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error inicializando juego: {str(e)}'})

@app.route('/robar_cartas', methods=['POST'])
def robar_cartas():
    """Robar nuevas cartas del mazo - Evita duplicados con cartas ya jugadas"""
    try:
        data = request.get_json()
        count = data.get('count', 0)
        
        if count <= 0:
            return jsonify({'success': False, 'message': 'Debe especificar cuántas cartas robar'})
        
        used_cards = data.get('playedCards', []) + data.get('currentHand', [])
        available_cards = [card for card in generate_full_deck() if not card_exists_in_list(card, used_cards)]
        
        if not available_cards:
            return jsonify({'success': False, 'message': 'No quedan cartas en el mazo', 'cards': []})
        
        random.shuffle(available_cards)
        cards_to_draw = min(count, len(available_cards))
        new_cards = available_cards[:cards_to_draw]
        
        if cards_to_draw < count:
            return jsonify({
                'success': True,
                'cards': new_cards,
                'message': f'Solo se pudieron robar {cards_to_draw} de {count} cartas',
                'warning': 'Mazo casi vacío'
            })
        
        return jsonify({'success': True, 'cards': new_cards, 'message': f'Se robaron {len(new_cards)} cartas'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error robando cartas: {str(e)}'})


@app.route('/jugar_cartas', methods=['POST'])
def jugar_cartas():
    """Procesar cartas jugadas - Devuelve puntos y actualiza el estado del juego"""
    try:
        data = request.get_json()
        cards = data.get('cards', [])
        game_state = data.get('gameState', {})
        
        if not cards:
            return jsonify({'success': False, 'message': 'No se proporcionaron cartas'})
        
        if game_state.get('hands', 0) <= 0:
            return jsonify({'success': False, 'message': 'No quedan manos disponibles'})
        
        game_state['hands'] -= 1
        points = 100
        game_state['score'] = game_state.get('score', 0) + points
        
        return jsonify({
            'success': True,
            'points': points,
            'gameState': game_state,
            'message': f'¡Cartas jugadas! +{points} puntos'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error procesando cartas: {str(e)}'})

@app.route('/descartar_cartas', methods=['POST'])
def descartar_cartas():
    """Procesar descarte de cartas - Actualiza el estado del juego"""
    try:
        data = request.get_json()
        cards = data.get('cards', [])
        game_state = data.get('gameState', {})
        
        if not cards:
            return jsonify({'success': False, 'message': 'No se proporcionaron cartas para descartar'})
        
        if game_state.get('discards', 0) <= 0:
            return jsonify({'success': False, 'message': 'No quedan descartes disponibles'})
        
        game_state['discards'] -= 1
        
        return jsonify({
            'success': True,
            'gameState': game_state,
            'discarded_count': len(cards),
            'message': f'Se descartaron {len(cards)} cartas'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error descartando cartas: {str(e)}'})

@app.route('/obtener_jokers_tienda', methods=['POST'])
def obtener_jokers_tienda():
    """Obtener 2 jokers aleatorios para la tienda"""
    try:
        game_state = request.get_json().get('gameState', {})
        
        if game_state.get('shopOpened', False):
            return jsonify({'success': False, 'message': 'La tienda ya fue abierta en esta ronda'})
        
        game_state['shopOpened'] = True
        
        return jsonify({
            'success': True,
            'jokers': random.sample(JOKERS, 2),
            'gameState': game_state
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error obteniendo jokers: {str(e)}'})

@app.route('/comprar_joker', methods=['POST'])
def comprar_joker():
    """Comprar un joker de la tienda"""
    try:
        data = request.get_json()
        joker = next((j for j in JOKERS if j['id'] == data.get('jokerId')), None)
        game_state = data.get('gameState', {})
        
        if not joker:
            return jsonify({'success': False, 'message': 'Joker no encontrado'})
        
        if game_state.get('money', 0) < joker['price']:
            return jsonify({'success': False, 'message': 'No tienes suficiente dinero'})
        
        game_state['money'] -= joker['price']
        
        return jsonify({
            'success': True,
            'joker': joker,
            'gameState': game_state,
            'message': f'Joker {joker["name"]} comprado'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error comprando joker: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)