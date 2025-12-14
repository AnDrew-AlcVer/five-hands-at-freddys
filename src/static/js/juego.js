let musicaJuego = null;
let POWERUPS = [];

async function cargarPowerups() {
    try {
        const res = await fetch('/static/config/powerups.json');
        const data = await res.json();
        POWERUPS = data.powerups;
    } catch (error) {
        console.error('Error cargando powerups:', error);
    }
}

function obtenerPowerups() {
    const powerups = JSON.parse(localStorage.getItem('powerupsSeleccionados')) || [];
    return powerups;
}

function aplicarPowerups(gameState) {
    const powerups = obtenerPowerups();
    
    powerups.forEach(powerup => {
        switch(powerup.efecto.tipo) {
            case 'dinero':
                if (!gameState.powerup_dinero_applied) {
                    gameState.money = (gameState.money || 0) + powerup.efecto.valor;
                    gameState.powerup_dinero_applied = true;
                }
                break;
            case 'descarte':
                gameState.discards = (gameState.discards || 4) + powerup.efecto.valor;
                break;
            case 'jugada':
                gameState.hands = (gameState.hands || 4) + powerup.efecto.valor;
                break;
            case 'multiplicador_dinero':
                gameState.dinero_multiplicador = powerup.efecto.valor;
                break;
            case 'puntos':
                gameState.puntos_bonus = (gameState.puntos_bonus || 0) + powerup.efecto.valor;
                break;
            case 'mano':
                gameState.hands = (gameState.hands || 4) + powerup.efecto.valor;
                break;
            case 'critico':
                gameState.mult_critico = powerup.efecto.valor;
                break;
            case 'regeneracion':
                gameState.regeneracion = powerup.efecto.valor;
                break;
        }
    });
    
    return gameState;
}

function iniciarMusicaJuego() {
    if (!musicaJuego) {
        musicaJuego = new Audio('/static/sound/ambiente.mp3');
        musicaJuego.loop = true;
        musicaJuego.volume = obtenerVolumenMusica();
        if (typeof window !== 'undefined') {
            window.musicaJuego = musicaJuego;
        }
    }

    musicaJuego.play().catch(() => {});
}

function pararMusicaJuego() {
    if (musicaJuego) {
        musicaJuego.pause();
    }
}

function actualizarBackgroundPorManos(hands) {
    document.body.classList.remove(
        'bg-manos-normal',
        'bg-manos-peligro',
        'bg-manos-critico'
    );

    if (hands >= 3) {
        document.body.classList.add('bg-manos-normal');
    } else if (hands === 2) {
        document.body.classList.add('bg-manos-peligro');
    } else {
        document.body.classList.add('bg-manos-critico');
    }
}

class Juego {
    constructor() {
        this.cartasSeleccionadas = [];
        this.manoJugador = [];
        this.cartasJugadas = [];
        this.estadoJuego = null;
        this.jokersTienda = [];
        this.jokersPropiedad = [];
        this.totalCartasUsadas = 0;

        this.gestorCartas = new GestorCartas(this);
        this.gestorJokers = new GestorJokers(this);
        this.accionesJuego = new AccionesJuego(this);
        this.gestorObjetivos = new GestorObjetivos();

        this.obtenerModoPartida();
        this.configurarEventos();
        iniciarMusicaJuego();

        this.cargarJuegoConObjetivos().catch(error => {
            console.error('Error en cargarJuegoConObjetivos:', error);
            
            this.cargarJuego();
        });
    }

    async cargarJuegoConObjetivos() {
        
        try {
            const cargado = await this.gestorObjetivos.cargarObjetivos();
            if (!cargado) {
                console.warn('No se cargaron objetivos, usando fallback');
            }
        } catch (error) {
            console.warn('Error en cargarObjetivos:', error);
        }

        await this.cargarJuego();
    }

    obtenerModoPartida() {
        const params = new URLSearchParams(window.location.search);
        this.modo = params.get('modo') || 'continuar';
    }

    async cargarJuego() {
        try {
            
            if (this.modo === 'nueva') {
                await this.generarManoJugador();
                return;
            }

            const res = await fetch('/game/obtener_ultima_partida', {
                credentials: 'include'
            });
            
            if (!res.ok) {
                await this.generarManoJugador();
                return;
            }
            
            const data = await res.json();

            if (data.success && data.has_saved_game) {
                this.estadoJuego = data.gameState || {};
                this.estadoJuego.score = this.estadoJuego.score || 0;
                this.estadoJuego.hands = this.estadoJuego.hands || 4;
                this.estadoJuego.discards = this.estadoJuego.discards || 4;
                this.estadoJuego.money = this.estadoJuego.money || 0;
                this.estadoJuego.chips = this.estadoJuego.chips || 0;
                this.estadoJuego.mult = this.estadoJuego.mult || 0;
                this.estadoJuego.round = this.estadoJuego.round || 1;
                this.estadoJuego.shopOpened = this.estadoJuego.shopOpened || false;
                
                const rondaActual = this.gestorObjetivos?.objetivos?.rondas?.find(r => r.numero === this.estadoJuego.round);
                this.estadoJuego.blindTarget = rondaActual?.puntos || this.estadoJuego.blindTarget || 300;

                // Aplicar baraja/powerup si aún no se ha aplicado en esta ronda
                const flagKey = `powerups_aplicados_round_${this.estadoJuego.round}`;
                const aplicado = sessionStorage.getItem(flagKey);
                const tienePowerup = (JSON.parse(localStorage.getItem('powerupsSeleccionados')) || []).length > 0;
                if (tienePowerup && !aplicado) {
                    this.estadoJuego = aplicarPowerups(this.estadoJuego);
                    sessionStorage.setItem(flagKey, '1');
                }

                this.manoJugador = (data.gameState.actual_hand || []).map((carta, indice) => ({ ...carta, id: indice }));
                this.cartasJugadas = [];  
                this.jokersPropiedad = data.gameState.purchased_jokers || [];
                this.jokersTienda = data.gameState.jokers_store || [];
                
                this.totalCartasUsadas = this.manoJugador.length;

                if (this.manoJugador.length < 9 && this.manoJugador.length > 0) {
                    const cartasArobar = 9 - this.manoJugador.length;
                    const resRobar = await fetch('/game/robar_cartas', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            count: cartasArobar,
                            playedCards: this.cartasJugadas,
                            currentHand: this.manoJugador
                        })
                    });
                    
                    const dataRobar = await resRobar.json();
                    if (dataRobar.success && dataRobar.cards) {
                        
                        const nuevasCartas = dataRobar.cards.map((carta, idx) => ({
                            ...carta,
                            id: this.manoJugador.length + idx
                        }));
                        this.manoJugador = this.manoJugador.concat(nuevasCartas);
                        this.totalCartasUsadas = this.manoJugador.length;
                    }
                }

                if (this.manoJugador.length === 0) {
                    await this.generarManoJugador();
                } else {
                    this.gestorCartas.renderizarManoJugador();
                    this.gestorJokers.renderizarJokers();
                    this.actualizarUI();
                }
            } else {
                await this.generarManoJugador();
            }
        } catch (error) {
            console.error('Error cargando juego:', error);
            await this.generarManoJugador();
        }
    }

    configurarEventos() {
        document.getElementById('playCardsBtn').addEventListener('click', () => this.accionesJuego.jugarCartasSeleccionadas());
        document.getElementById('discardBtn').addEventListener('click', () => this.accionesJuego.descartarCartasSeleccionadas());

        const botonSalir = document.getElementById('exitGameBtn');
        if (botonSalir) {
            botonSalir.addEventListener('click', () => {
                pararMusicaJuego();
                window.location.href = '/menu';
            });
        }

        const botonTienda = document.querySelector('.shop-header');
        if (botonTienda) {
            botonTienda.style.cursor = 'pointer';
            botonTienda.addEventListener('click', () => this.gestorJokers.abrirTienda());
        }
    }

    async generarManoJugador() {
        const respuesta = await fetch('/game/inicializar_juego', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const resultado = await respuesta.json();

        if (resultado.success) {
            this.estadoJuego = resultado.gameState;
            this.estadoJuego = aplicarPowerups(this.estadoJuego);
            this.manoJugador = resultado.hand.map((carta, indice) => ({ ...carta, id: indice }));
            this.totalCartasUsadas = this.manoJugador.length;
            this.gestorCartas.renderizarManoJugador();
            this.actualizarUI();
            
            await this.guardarPartidaAutomatica();
        }
    }

    async guardarPartidaAutomatica() {
        await fetch('/game/guardar_partida', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameState: this.estadoJuego,
                actual_hand: this.manoJugador,
                played_cards: this.cartasJugadas,
                num_played_cards: this.totalCartasUsadas,
                purchased_jokers: this.jokersPropiedad,
                open_store: this.estadoJuego.shopOpened || false,
                jokers_store: this.jokersTienda
            })
        }).catch(() => { });
    }

    alternarSeleccionCarta(idCarta) {
        const elementoCarta = document.querySelector(`[data-card-id="${idCarta}"]`);
        const estaSeleccionada = this.cartasSeleccionadas.includes(idCarta);

        if (estaSeleccionada) {
            this.cartasSeleccionadas = this.cartasSeleccionadas.filter(id => id !== idCarta);
            elementoCarta.classList.remove('selected');
        } else if (this.cartasSeleccionadas.length < 5) {
            this.cartasSeleccionadas.push(idCarta);
            elementoCarta.classList.add('selected');
        }

        this.actualizarBotonJugar();
    }

    actualizarBotonJugar() {
        const botonJugar = document.getElementById('playCardsBtn');
        const contadorSeleccion = document.getElementById('selectionCount');

        botonJugar.disabled = this.cartasSeleccionadas.length === 0 || this.estadoJuego.hands <= 0;

        if (this.estadoJuego.hands <= 0) {
            botonJugar.textContent = 'NO QUEDAN MANOS';
        } else if (this.cartasSeleccionadas.length > 0) {
            botonJugar.textContent = `JUGAR ${this.cartasSeleccionadas.length} CARTA${this.cartasSeleccionadas.length > 1 ? 'S' : ''}`;
        } else {
            botonJugar.textContent = 'JUGAR CARTAS';
        }

        contadorSeleccion.textContent = `${this.cartasSeleccionadas.length}/5 cartas seleccionadas`;

        if (this.cartasSeleccionadas.length === 5) {
            contadorSeleccion.style.color = '#e74c3c';
        } else if (this.cartasSeleccionadas.length > 0) {
            contadorSeleccion.style.color = '#f1c40f';
        } else {
            contadorSeleccion.style.color = '#f1c40f';
        }
    }

    limpiarSeleccion() {
        this.cartasSeleccionadas = [];
        document.querySelectorAll('.card.selected').forEach(carta => {
            carta.classList.remove('selected');
        });
        this.actualizarBotonJugar();
    }

    actualizarUI() {
        if (!this.estadoJuego) return;

        const elementos = {
            roundScore: document.getElementById('roundScore'),
            blindTarget: document.getElementById('blindTarget'),
            chipsValue: document.getElementById('chipsValue'),
            multValue: document.getElementById('multValue'),
            handsValue: document.getElementById('handsValue'),
            discardsValue: document.getElementById('discardsValue'),
            moneyValue: document.getElementById('moneyValue'),
            deckCount: document.querySelector('.deck-count')
        };

        if (elementos.roundScore) elementos.roundScore.textContent = this.estadoJuego.score || 0;
        if (elementos.blindTarget) elementos.blindTarget.textContent = this.estadoJuego.blindTarget || 300;
        if (elementos.chipsValue) elementos.chipsValue.textContent = this.estadoJuego.chips || 0;
        if (elementos.multValue) elementos.multValue.textContent = this.estadoJuego.mult || 0;
        if (elementos.handsValue) elementos.handsValue.textContent = this.estadoJuego.hands || 0;
        if (elementos.discardsValue) elementos.discardsValue.textContent = this.estadoJuego.discards || 0;
        if (elementos.moneyValue) elementos.moneyValue.textContent = `$${this.estadoJuego.money || 0}`;
        if (elementos.deckCount) elementos.deckCount.textContent = `${52 - this.totalCartasUsadas}/52`;

        if (elementos.blindTarget) {
            const progress = Math.min((this.estadoJuego.score / this.estadoJuego.blindTarget) * 100, 100);
            elementos.blindTarget.style.color = progress >= 100 ? '#2ecc71' : progress >= 75 ? '#f1c40f' : '#fff';
        }

        actualizarBackgroundPorManos(this.estadoJuego.hands);
    }
}

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await cargarPowerups();
            window.juego = new Juego();
        });
    } else {
        cargarPowerups().then(() => {
            window.juego = new Juego();
        });
    }
}
