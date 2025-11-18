from flask import request, jsonify, session
from py.database import db
from py.models import SavedGame, User, Leaderboard
import random
import json
import os
from functools import wraps

def load_jokers():
    jokers_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'jokers.json')
    try:
        with open(jokers_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_objetivos():
    objetivos_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'objetivos.json')
    try:
        with open(objetivos_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"rondas": [], "mensajes_finales": {}, "configuracion": {}}

JOKERS = load_jokers()
OBJETIVOS = load_objetivos()

def generate_full_deck():
    suits = ['♠', '♥', '♦', '♣']
    values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    red_suits = {'♥', '♦'}
    return [{
        'suit': suit, 'value': value,
        'color': 'red' if suit in red_suits else 'black'
    } for suit in suits for value in values]

def card_exists_in_list(card, card_list):
    if not isinstance(card_list, list):
        return False
    return any(c.get('suit') == card.get('suit') and c.get('value') == card.get('value')
               for c in card_list if isinstance(c, dict))

def require_session(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'No hay sesión activa'}), 401
        return f(*args, **kwargs)
    return wrapper

def inicializar_juego():
    try:
        data = request.get_json() or {}
        round_number = data.get('round', 1)
        played_cards = data.get('played_cards', [])
        current_hand = data.get('current_hand', [])

        if not isinstance(round_number, int) or round_number < 1 or round_number > 8:
            return jsonify({'success': False, 'message': 'Ronda inválida (1-8)'}), 400

        blind_target = 300 + (round_number - 1) * 200

        used_cards = played_cards + current_hand
        full_deck = generate_full_deck()
        available_cards = [card for card in full_deck if not card_exists_in_list(card, used_cards)]
        random.shuffle(available_cards)

        return jsonify({
            'success': True,
            'hand': available_cards[:9],
            'gameState': {
                'score': 0, 'hands': 4, 'discards': 4, 'money': 0,
                'shopOpened': False, 'round': round_number, 'blindTarget': blind_target,
                'chips': 0, 'mult': 0
            },
            'message': 'Juego inicializado'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def robar_cartas():
    try:
        data = request.get_json() or {}
        count = data.get('count', 0)
        played_cards = data.get('playedCards', [])
        current_hand = data.get('currentHand', [])

        if not isinstance(count, int) or count <= 0:
            return jsonify({'success': False, 'message': 'count debe ser positivo'}), 400

        used_cards = played_cards + current_hand
        available_cards = [card for card in generate_full_deck() if not card_exists_in_list(card, used_cards)]

        if not available_cards:
            return jsonify({'success': False, 'message': 'No quedan cartas', 'cards': []}), 200

        random.shuffle(available_cards)
        cards_to_draw = min(count, len(available_cards))
        new_cards = available_cards[:cards_to_draw]

        return jsonify({
            'success': True, 'cards': new_cards,
            'message': f'Se robaron {len(new_cards)} cartas'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def jugar_cartas():
    try:
        data = request.get_json() or {}
        cards = data.get('played_cards', [])
        game_state = data.get('gameState', {})

        if not isinstance(cards, list) or len(cards) == 0:
            return jsonify({'success': False, 'message': 'Se deben proporcionar cartas'}), 400

        if game_state.get('hands', 0) <= 0:
            return jsonify({'success': False, 'message': 'No quedan manos'}), 400

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
            'success': True, 'gameState': game_state, 'score': game_state['score'],
            'roundWon': round_won,
            'message': f'Jugadas {len(cards)} cartas'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def descartar_cartas():
    try:
        data = request.get_json() or {}
        cards = data.get('discarded_cards', [])
        game_state = data.get('gameState', {})

        if not isinstance(cards, list) or len(cards) == 0:
            return jsonify({'success': False, 'message': 'Cartas requeridas'}), 400

        if game_state.get('discards', 0) <= 0:
            return jsonify({'success': False, 'message': 'No quedan descartes'}), 400

        game_state['discards'] -= 1
        return jsonify({
            'success': True, 'remaining_discards': game_state['discards'],
            'message': f'Descartadas {len(cards)} cartas'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def obtener_jokers_tienda():
    try:
        data = request.get_json() or {}
        game_state = data.get('gameState', {})

        if game_state.get('shopOpened', False):
            return jsonify({'success': False, 'message': 'Tienda ya abierta'}), 400

        game_state['shopOpened'] = True

        if not JOKERS or len(JOKERS) < 2:
            return jsonify({
                'success': True, 'jokers': JOKERS[:2] if JOKERS else [],
                'gameState': game_state
            }), 200

        available_jokers = [j for j in JOKERS if j.get('price', 100) <= 100]
        if len(available_jokers) < 2:
            available_jokers = JOKERS

        selected_jokers = random.sample(available_jokers, min(2, len(available_jokers)))
        return jsonify({
            'success': True, 'jokers': selected_jokers, 'gameState': game_state
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def comprar_joker():
    try:
        data = request.get_json() or {}
        joker_id = data.get('joker_id')
        game_state = data.get('gameState', {})

        if not joker_id:
            return jsonify({'success': False, 'message': 'joker_id requerido'}), 400

        joker = next((j for j in JOKERS if j.get('id') == joker_id), None)

        if not joker:
            return jsonify({'success': False, 'message': 'Joker no encontrado'}), 404

        joker_price = joker.get('price', 0)
        if game_state.get('money', 0) < joker_price:
            return jsonify({'success': False, 'message': 'Dinero insuficiente'}), 400

        game_state['money'] -= joker_price
        return jsonify({
            'success': True, 'joker': joker, 'remaining_money': game_state['money'],
            'message': f'Comprado {joker.get("name", "Joker")}'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def guardar_partida():
    try:
        data = request.get_json() or {}
        game_state = data.get('gameState', {})

        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        saved_game = user.saved_game
        if not saved_game:
            saved_game = SavedGame(
                score=0, hands_left=4, discards_left=4, money=0,
                actual_hand='[]', played_cards='[]', num_played_cards=9
            )
            user.saved_game = saved_game
            db.session.add(saved_game)

        saved_game.score = game_state.get('score', 0)
        saved_game.hands_left = game_state.get('hands', 4)
        saved_game.discards_left = game_state.get('discards', 4)
        saved_game.money = game_state.get('money', 0)
        saved_game.actual_hand = json.dumps(data.get('actual_hand', []))
        saved_game.played_cards = json.dumps(data.get('played_cards', []))
        saved_game.num_played_cards = data.get('num_played_cards', 9)
        saved_game.purchased_jokers = json.dumps(data.get('purchased_jokers', []))
        saved_game.open_store = 1 if data.get('open_store') else 0
        saved_game.jokers_store = json.dumps(data.get('jokers_store', []))
        saved_game.round = game_state.get('round', 1)
        saved_game.blind_target = game_state.get('blindTarget', 300)
        saved_game.chips = game_state.get('chips', 0)
        saved_game.mult = game_state.get('mult', 0)

        db.session.commit()

        current_score = game_state.get('score', 0)
        leaderboard = Leaderboard.query.filter_by(user_id=user.id).first()
        if leaderboard and current_score > leaderboard.max_score:
            leaderboard.max_score = current_score
            db.session.commit()

        return jsonify({'success': True, 'message': 'Partida guardada'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def obtener_ultima_partida():
    try:
        user = User.query.get(session['user_id'])

        if not user or not user.saved_game:
            return jsonify({'success': True, 'has_saved_game': False}), 200

        saved_game = user.saved_game

        return jsonify({
            'success': True, 'has_saved_game': True,
            'gameState': {
                'score': saved_game.score, 'hands': saved_game.hands_left,
                'discards': saved_game.discards_left, 'money': saved_game.money,
                'actual_hand': json.loads(saved_game.actual_hand or '[]'),
                'played_cards': json.loads(saved_game.played_cards or '[]'),
                'num_played_cards': saved_game.num_played_cards,
                'purchased_jokers': json.loads(saved_game.purchased_jokers or '[]'),
                'shopOpened': bool(saved_game.open_store),
                'jokers_store': json.loads(saved_game.jokers_store or '[]'),
                'round': saved_game.round, 'blindTarget': saved_game.blind_target,
                'chips': saved_game.chips, 'mult': saved_game.mult
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def obtener_objetivos():
    try:
        return jsonify({
            'success': True,
            'objetivos': OBJETIVOS
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def validar_ronda(numero_ronda, puntuacion):
    try:
        if not OBJETIVOS.get('rondas'):
            return jsonify({'success': False, 'message': 'Objetivos no disponibles'}), 500

        ronda = next((r for r in OBJETIVOS['rondas'] if r['numero'] == numero_ronda), None)
        if not ronda:
            return jsonify({'success': False, 'message': f'Ronda {numero_ronda} no encontrada'}), 404

        puntos_requeridos = ronda['puntos']
        aprobada = puntuacion >= puntos_requeridos

        return jsonify({
            'success': True,
            'aprobada': aprobada,
            'ronda': numero_ronda,
            'puntuacion': puntuacion,
            'puntos_requeridos': puntos_requeridos,
            'mensaje': OBJETIVOS['mensajes']['victoria'] if aprobada else OBJETIVOS['mensajes']['derrota'],
            'recompensa': ronda['recompensa'] if aprobada else 0
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def borrar_partida_guardada():
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        if user.saved_game:

            saved_game = user.saved_game
            saved_game.score = 0
            saved_game.hands_left = 4
            saved_game.discards_left = 4
            saved_game.money = 0
            saved_game.actual_hand = '[]'
            saved_game.played_cards = '[]'
            saved_game.num_played_cards = 9
            saved_game.purchased_jokers = '[]'
            saved_game.open_store = 0
            saved_game.jokers_store = '[]'
            saved_game.round = 1
            saved_game.blind_target = 300
            saved_game.chips = 0
            saved_game.mult = 0

            db.session.commit()
            return jsonify({'success': True, 'message': 'Partida guardada borrada'}), 200

        return jsonify({'success': False, 'message': 'No hay partida guardada'}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
