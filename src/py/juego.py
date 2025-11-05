"""
Rutas del juego (cartas, jokers, etc.)
"""
from flask import Blueprint, request, jsonify, session
from py.database import get_db_connection
import random
import json
import os

game_bp = Blueprint('game', __name__)

def load_jokers():
    jokers_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'jokers.json')
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

@game_bp.route('/inicializar_juego', methods=['POST'])
def inicializar_juego():
    """Inicializar el juego"""
    try:
        # Intentar obtener JSON, si falla usar valores por defecto
        data = {}
        try:
            if request.is_json:
                data = request.get_json() or {}
        except:
            pass
        
        round_number = data.get('round', 1)
        
        blind_target = 300 + (round_number - 1) * 200
        
        full_deck = generate_full_deck()
        random.shuffle(full_deck)
        
        return jsonify({
            'success': True,
            'hand': full_deck[:9],
            'gameState': {
                'score': 0,
                'hands': 4,
                'discards': 4,
                'money': 0,
                'shopOpened': False,
                'round': round_number,
                'blindTarget': blind_target,
                'chips': 0,
                'mult': 0
            },
            'message': 'Juego inicializado'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error inicializando juego: {str(e)}'})

@game_bp.route('/robar_cartas', methods=['POST'])
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

@game_bp.route('/jugar_cartas', methods=['POST'])
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
        
        chips = len(cards) * 20
        mult = len(cards) + 2
        points = chips * mult
        
        game_state['score'] = game_state.get('score', 0) + points
        game_state['chips'] = chips
        game_state['mult'] = mult
        
        blind_target = game_state.get('blindTarget', 300)
        round_won = game_state['score'] >= blind_target
        
        return jsonify({
            'success': True,
            'points': points,
            'chips': chips,
            'mult': mult,
            'gameState': game_state,
            'roundWon': round_won,
            'message': f'¡Cartas jugadas! {chips} x {mult} = {points} puntos'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error procesando cartas: {str(e)}'})

@game_bp.route('/descartar_cartas', methods=['POST'])
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

@game_bp.route('/obtener_jokers_tienda', methods=['POST'])
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

@game_bp.route('/comprar_joker', methods=['POST'])
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


@game_bp.route('/guardar_partida', methods=['POST'])
def guardar_partida():
    """Guardar el estado de la partida para el usuario logueado"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'No hay sesión activa'})

    try:
        data = request.get_json() or {}
        game_state = data.get('gameState', {})
        actual_hand = data.get('actual_hand', None)
        played_cards = data.get('played_cards', None)
        num_played = data.get('num_played_cards', None)
        purchased_jokers = data.get('purchased_jokers', None)
        open_store = data.get('open_store', None)
        jokers_store = data.get('jokers_store', None)

        conn = get_db_connection()
        # Obtener el id de saved_game asociado al usuario
        row = conn.execute('SELECT save_game FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        save_game_id = row['save_game'] if row else None

        if save_game_id:
            # Actualizar saved_games
            conn.execute('''
                UPDATE saved_games
                SET score = ?, hands_left = ?, discards_left = ?, money = ?, actual_hand = ?, played_cards = ?, num_played_cards = ?, purchased_jokers = ?, open_store = ?, jokers_store = ?, round = ?, blind_target = ?, chips = ?, mult = ?
                WHERE id = ?
            ''', (
                game_state.get('score', 0),
                game_state.get('hands', 4),
                game_state.get('discards', 4),
                game_state.get('money', 0),
                json.dumps(actual_hand) if actual_hand is not None else json.dumps(game_state.get('actual_hand', [])),
                json.dumps(played_cards) if played_cards is not None else json.dumps(game_state.get('played_cards', [])),
                num_played if num_played is not None else game_state.get('num_played_cards', 9),
                json.dumps(purchased_jokers) if purchased_jokers is not None else json.dumps(game_state.get('purchased_jokers', [])),
                1 if open_store or game_state.get('shopOpened', False) else 0,
                json.dumps(jokers_store) if jokers_store is not None else json.dumps(game_state.get('jokers_store', [])),
                game_state.get('round', 1),
                game_state.get('blindTarget', 300),
                game_state.get('chips', 0),
                game_state.get('mult', 0),
                save_game_id
            ))
        else:
            # Insertar nuevo saved_games y actualizar users.save_game
            cursor = conn.execute('''
                INSERT INTO saved_games (score, hands_left, discards_left, money, actual_hand, played_cards, num_played_cards, purchased_jokers, open_store, jokers_store, round, blind_target, chips, mult)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                game_state.get('score', 0),
                game_state.get('hands', 4),
                game_state.get('discards', 4),
                game_state.get('money', 0),
                json.dumps(actual_hand) if actual_hand is not None else json.dumps(game_state.get('actual_hand', [])),
                json.dumps(played_cards) if played_cards is not None else json.dumps(game_state.get('played_cards', [])),
                num_played if num_played is not None else game_state.get('num_played_cards', 9),
                json.dumps(purchased_jokers) if purchased_jokers is not None else json.dumps(game_state.get('purchased_jokers', [])),
                1 if open_store or game_state.get('shopOpened', False) else 0,
                json.dumps(jokers_store) if jokers_store is not None else json.dumps(game_state.get('jokers_store', [])),
                game_state.get('round', 1),
                game_state.get('blindTarget', 300),
                game_state.get('chips', 0),
                game_state.get('mult', 0)
            ))
            new_id = cursor.lastrowid
            conn.execute('UPDATE users SET save_game = ? WHERE id = ?', (new_id, session['user_id']))

        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Partida guardada'})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error guardando partida: {str(e)}'})


@game_bp.route('/obtener_ultima_partida', methods=['GET'])
def obtener_ultima_partida():
    """Devuelve la última partida guardada del usuario"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'No hay sesión activa'})

    try:
        conn = get_db_connection()
        row = conn.execute('SELECT save_game FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        save_game_id = row['save_game'] if row else None

        if not save_game_id:
            conn.close()
            return jsonify({'success': True, 'has_saved_game': False})

        saved = conn.execute('SELECT * FROM saved_games WHERE id = ?', (save_game_id,)).fetchone()
        conn.close()

        if not saved:
            return jsonify({'success': True, 'has_saved_game': False})

        return jsonify({
            'success': True,
            'has_saved_game': True,
            'gameState': {
                'score': saved['score'],
                'hands': saved['hands_left'],
                'discards': saved['discards_left'],
                'money': saved['money'],
                'actual_hand': json.loads(saved['actual_hand'] or '[]'),
                'played_cards': json.loads(saved['played_cards'] or '[]'),
                'num_played_cards': saved['num_played_cards'],
                'purchased_jokers': json.loads(saved['purchased_jokers'] or '[]'),
                'shopOpened': bool(saved['open_store']),
                'jokers_store': json.loads(saved['jokers_store'] or '[]'),
                'round': saved.get('round', 1),
                'blindTarget': saved.get('blind_target', 300),
                'chips': saved.get('chips', 0),
                'mult': saved.get('mult', 0)
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error obteniendo partida: {str(e)}'})
