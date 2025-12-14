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
        return {"rondas": [], "mensajes": {}}

JOKERS = load_jokers()
OBJETIVOS = load_objetivos()

def reload_objetivos():
    global OBJETIVOS
    OBJETIVOS = load_objetivos()
    return OBJETIVOS

def get_blind_target(round_number):
    rondas = OBJETIVOS.get('rondas', [])
    for ronda in rondas:
        if ronda.get('numero') == round_number:
            return ronda.get('puntos', 300)
    return 300

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
        reload_objetivos()
        data = request.get_json() or {}
        round_number = data.get('round', 1)
        played_cards = data.get('played_cards', [])
        current_hand = data.get('current_hand', [])

        max_rounds = len(OBJETIVOS.get('rondas', []))
        if not isinstance(round_number, int) or round_number < 1 or round_number > max_rounds:
            return jsonify({'success': False, 'message': f'Ronda inválida (1-{max_rounds})'}), 400

        blind_target = get_blind_target(round_number)

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
                'chips': 0, 'mult': 0,
                'chips_bonus_next_play': 0,
                'discard_actions': 0,
                'puppet_used_round': False,
                'phone_guy_used_round': False,
                'powerup_dinero_applied': False
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

def _apply_jokers_to_play(cards, game_state, purchased_jokers):
    # Base scores: ahora basados en combinación de póker
    def rank_value(v):
        try:
            return int(v)
        except Exception:
            return {'J': 10, 'Q': 11, 'K': 12, 'A': 13}.get(str(v), 0)

    def evaluate_hand(cards_eval):
        # Devuelve (chips_base, mult_base) según la combinación
        from collections import Counter
        values = [c.get('value') for c in cards_eval]
        suits = [c.get('suit') for c in cards_eval]
        ranks = sorted([rank_value(v) for v in values])
        counts = Counter(values)
        count_sorted = sorted(counts.values(), reverse=True)
        is_flush = len(set(suits)) == 1 and len(cards_eval) >= 5 or (len(set(suits)) == 1 and len(cards_eval) >= 3)
        # straight: requiere al menos 3 cartas consecutivas
        unique_ranks = sorted(set(ranks))
        consec = 0
        for i in range(1, len(unique_ranks)):
            if unique_ranks[i] == unique_ranks[i-1] + 1:
                consec += 1
        is_straight = consec >= (len(unique_ranks) - 1) and len(unique_ranks) >= 3

        # Sumar valor de cartas como parte de fichas
        sum_cards = sum(ranks)

        # Clasificación por prioridad
        # Escalera de color (straight flush)
        if is_straight and is_flush and len(cards_eval) >= 5:
            return (sum_cards + 100, 8)
        # Poker (cuatro iguales)
        if 4 in count_sorted:
            return (sum_cards + 60, 7)
        # Full (3+2)
        if 3 in count_sorted and 2 in count_sorted:
            return (sum_cards + 45, 4)
        # Color (flush)
        if is_flush and len(cards_eval) >= 5:
            return (sum_cards + 40, 4)
        # Escalera (straight)
        if is_straight and len(unique_ranks) >= 3:
            return (sum_cards + 35, 4)
        # Trío
        if 3 in count_sorted:
            return (sum_cards + 35, 3)
        # Doble pareja
        if count_sorted.count(2) >= 2:
            return (sum_cards + 30, 2)
        # Pareja
        if 2 in count_sorted:
            return (sum_cards + 15, 2)
        # Carta más alta
        return (sum_cards, 1)

    # Preparar chips y mult de base
    base_chips, base_mult = evaluate_hand(cards)
    chips = base_chips + game_state.get('chips_bonus_next_play', 0)
    # Reset chips bonus once consumed
    game_state['chips_bonus_next_play'] = 0

    # Helper counts
    # Pre-process Phone Guy: convert one card to J once per round
    cards_mod = [dict(c) for c in cards]
    if purchased_jokers:
        for j in purchased_jokers:
            eff = j.get('effect')
            t = eff.get('type') if isinstance(eff, dict) else j.get('effect')
            if t == 'convert_one_to_J_once' and not bool(game_state.get('phone_guy_used_round', False)):
                for cm in cards_mod:
                    if cm.get('value') not in ['J']:
                        cm['value'] = 'J'
                        game_state['phone_guy_used_round'] = True
                        break
                break

    num_spades = sum(1 for c in cards_mod if c.get('suit') == '♠')
    num_hearts = sum(1 for c in cards_mod if c.get('suit') == '♥')
    has_face = any((c.get('value') in ['J', 'Q', 'K']) for c in cards_mod)
    has_low = any((c.get('value') in ['2', '3', '4', '5']) for c in cards_mod)

    # Helper: map values to ranks for consecutive detection (usa evaluate rank_value)
    ranks = sorted(set(rank_value(c.get('value')) for c in cards_mod))
    consecutive_pairs = sum(1 for i in range(1, len(ranks)) if ranks[i] == ranks[i-1] + 1)
    # counts for duplicates/one pair
    from collections import Counter
    value_counts = Counter(c.get('value') for c in cards_mod)
    pairs_count = sum(1 for v,cnt in value_counts.items() if cnt == 2)
    has_duplicates = any(cnt > 1 for cnt in value_counts.values())

    # Handle Mimic: prepare a list of effects to apply, where mimic duplicates leftmost non-mimic effect
    jokers_to_apply = list(purchased_jokers or [])
    if jokers_to_apply:
        leftmost = next((j for j in jokers_to_apply if (j.get('effect') if not isinstance(j.get('effect'), dict) else j['effect'].get('type')) != 'mimic_leftmost'), None)
        has_mimic = any(((j.get('effect') if not isinstance(j.get('effect'), dict) else j['effect'].get('type')) == 'mimic_leftmost') for j in jokers_to_apply)
        if has_mimic and leftmost:
            jokers_to_apply.append(leftmost)

    for joker in jokers_to_apply:
        eff = joker.get('effect')
        if isinstance(eff, dict):
            t = eff.get('type')
            val = eff.get('value', 0)
        else:
            t = joker.get('effect')
            val = joker.get('value', 0)

        if t == 'face_chips_bonus' and has_face:
            chips += val
        elif t == 'spade_mult_per_card':
            base_mult += num_spades * int(val)
        elif t == 'heart_chips_per_card':
            chips += num_hearts * int(val)
        elif t == 'low_cards_mult_double' and has_low:
            base_mult *= 2
        elif t == 'first_hand_mult_bonus':
            # Consider first hand when hands are at default 4
            if game_state.get('hands', 4) == 4:
                base_mult += int(val)
        elif t == 'chips_per_card':
            chips += len(cards_mod) * int(val)
        elif t == 'mimic_leftmost':
            # already handled by appending leftmost effect; skip explicit mimic token
            continue
        elif t == 'per_card_mult_chance':
            chance = eff.get('chance', 0.33) if isinstance(eff, dict) else 0.33
            import random
            bonus = sum(1 for _ in cards if random.random() < float(chance)) * int(val)
            base_mult += bonus
        elif t == 'no_duplicates_x2_once':
            if not has_duplicates and not bool(game_state.get('puppet_used_round', False)):
                base_mult *= int(val)
                game_state['puppet_used_round'] = True
        elif t == 'random_mult_range':
            import random
            minv = eff.get('min', 1.2) if isinstance(eff, dict) else 1.2
            maxv = eff.get('max', 2.0) if isinstance(eff, dict) else 2.0
            factor = random.uniform(float(minv), float(maxv))
            base_mult = int(round(base_mult * factor))
        elif t == 'consecutive_chips_bonus':
            chips += consecutive_pairs * int(val)
        elif t == 'exactly_one_pair_x2':
            if pairs_count == 1 and not any(cnt > 2 for cnt in value_counts.values()):
                base_mult *= int(val)
        elif t == 'chips_bonus_on_n_cards':
            try:
                thresholds = eff.get('thresholds', []) if isinstance(eff, dict) else []
                for th in thresholds:
                    n = int(th.get('n', 0))
                    bonus = int(th.get('value', 0))
                    if len(cards_mod) == n:
                        chips += bonus
                        break
            except Exception:
                pass

    game_state['chips'] = chips
    game_state['mult'] = base_mult
    game_state['score'] = game_state.get('score', 0) + chips * base_mult
    return game_state

def jugar_cartas():
    try:
        data = request.get_json() or {}
        cards = data.get('played_cards', [])
        game_state = data.get('gameState', {})
        actual_hand = data.get('actual_hand', [])
        all_played_cards = data.get('all_played_cards', [])
        num_played_cards = data.get('num_played_cards', 9)
        purchased_jokers = data.get('purchased_jokers', [])
        jokers_store = data.get('jokers_store', [])

        if not isinstance(cards, list) or len(cards) == 0:
            return jsonify({'success': False, 'message': 'Se deben proporcionar cartas'}), 400

        if game_state.get('hands', 0) <= 0:
            return jsonify({'success': False, 'message': 'No quedan manos'}), 400

        game_state['hands'] -= 1

        # Apply jokers logic to this play
        game_state = _apply_jokers_to_play(cards, game_state, purchased_jokers)

        blind_target = game_state.get('blindTarget', 300)
        round_won = game_state['score'] >= blind_target
        
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user and user.saved_game:
                saved_game = user.saved_game
                saved_game.score = game_state.get('score', 0)
                saved_game.hands_left = game_state.get('hands', 4)
                saved_game.discards_left = game_state.get('discards', 4)
                saved_game.money = game_state.get('money', 0)
                saved_game.chips = game_state.get('chips', 0)
                saved_game.mult = game_state.get('mult', 0)
                saved_game.actual_hand = json.dumps(actual_hand)
                saved_game.played_cards = json.dumps(all_played_cards)
                saved_game.num_played_cards = num_played_cards
                saved_game.purchased_jokers = json.dumps(purchased_jokers)
                saved_game.jokers_store = json.dumps(jokers_store)
                saved_game.open_store = 1 if game_state.get('shopOpened', False) else 0
                saved_game.round = game_state.get('round', 1)
                saved_game.blind_target = game_state.get('blindTarget', 300)
                db.session.commit()

        return jsonify({
            'success': True, 'gameState': game_state, 'score': game_state['score'],
            'roundWon': round_won,
            'message': f'Jugadas {len(cards)} cartas'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

def descartar_cartas():
    try:
        data = request.get_json() or {}
        cards = data.get('discarded_cards', [])
        game_state = data.get('gameState', {})
        actual_hand = data.get('actual_hand', [])
        all_played_cards = data.get('all_played_cards', [])
        num_played_cards = data.get('num_played_cards', 9)
        purchased_jokers = data.get('purchased_jokers', [])
        jokers_store = data.get('jokers_store', [])

        if not isinstance(cards, list) or len(cards) == 0:
            return jsonify({'success': False, 'message': 'Cartas requeridas'}), 400

        if game_state.get('discards', 0) <= 0:
            return jsonify({'success': False, 'message': 'No quedan descartes'}), 400

        game_state['discards'] -= 1
        # Track discard actions
        game_state['discard_actions'] = int(game_state.get('discard_actions', 0)) + 1

        # Balloon Boy: every 2 discards -> +X chips to next play
        try:
            for joker in (purchased_jokers or []):
                eff = joker.get('effect')
                if isinstance(eff, dict):
                    t = eff.get('type')
                    val = eff.get('value', 0)
                else:
                    t = joker.get('effect')
                    val = joker.get('value', 0)
                if t == 'chips_bonus_every_2_discards' and game_state['discard_actions'] % 2 == 0:
                    game_state['chips_bonus_next_play'] = int(game_state.get('chips_bonus_next_play', 0)) + int(val)
        except Exception:
            pass
        
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user and user.saved_game:
                saved_game = user.saved_game
                saved_game.score = game_state.get('score', 0)
                saved_game.hands_left = game_state.get('hands', 4)
                saved_game.discards_left = game_state.get('discards', 4)
                saved_game.money = game_state.get('money', 0)
                saved_game.chips = game_state.get('chips', 0)
                saved_game.mult = game_state.get('mult', 0)
                saved_game.actual_hand = json.dumps(actual_hand)
                saved_game.played_cards = json.dumps(all_played_cards)
                saved_game.num_played_cards = num_played_cards
                saved_game.purchased_jokers = json.dumps(purchased_jokers)
                saved_game.jokers_store = json.dumps(jokers_store)
                saved_game.open_store = 1 if game_state.get('shopOpened', False) else 0
                saved_game.round = game_state.get('round', 1)
                saved_game.blind_target = game_state.get('blindTarget', 300)
                db.session.commit()
        
        return jsonify({
            'success': True, 'gameState': game_state, 'remaining_discards': game_state['discards'],
            'message': f'Descartadas {len(cards)} cartas'
        }), 200
    except Exception as e:
        db.session.rollback()
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
        reload_objetivos()
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
