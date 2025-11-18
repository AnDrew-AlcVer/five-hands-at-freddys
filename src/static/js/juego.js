let musicaJuego = null;

function iniciarMusicaJuego() {
    if (!musicaJuego) {
        musicaJuego = new Audio('/static/sound/ambiente.mp3');
        musicaJuego.loop = true;
        musicaJuego.volume = 0.5;
    }

    musicaJuego.play().catch(err => {
        console.log("Audio bloqueado:", err);
    });
}

function pararMusicaJuego() {
    if (musicaJuego) {
        musicaJuego.pause();
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
        
        // Cargar objetivos y juego de forma asincrónica
        this.cargarJuegoConObjetivos().catch(error => {
            console.error('Error en cargarJuegoConObjetivos:', error);
            // Fallback: cargar juego sin objetivos
            this.cargarJuego();
        });
    }

    async cargarJuegoConObjetivos() {
        // Cargar objetivos primero
        try {
            const cargado = await this.gestorObjetivos.cargarObjetivos();
            if (!cargado) {
                console.warn('No se cargaron objetivos, usando fallback');
            }
        } catch (error) {
            console.warn('Error en cargarObjetivos:', error);
        }
        
        // Luego cargar el juego
        await this.cargarJuego();
    }

    obtenerModoPartida() {
        const params = new URLSearchParams(window.location.search);
        this.modo = params.get('modo') || 'continuar';
    }

    async cargarJuego() {
        try {
            // Si el modo es "nueva", generar directamente sin intentar cargar
            if (this.modo === 'nueva') {
                await this.generarManoJugador();
                return;
            }

            // Si es "continuar", intentar cargar la partida guardada
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
                this.estadoJuego.blindTarget = this.estadoJuego.blindTarget || 300;
                this.estadoJuego.chips = this.estadoJuego.chips || 0;
                this.estadoJuego.mult = this.estadoJuego.mult || 0;
                this.estadoJuego.round = this.estadoJuego.round || 1;
                this.estadoJuego.shopOpened = this.estadoJuego.shopOpened || false;

                this.manoJugador = (data.gameState.actual_hand || []).map((carta, indice) => ({ ...carta, id: indice }));
                this.cartasJugadas = [];  // 🔧 Limpiar cartas jugadas al cargar (son del turno anterior)
                this.jokersPropiedad = data.gameState.purchased_jokers || [];
                this.jokersTienda = data.gameState.jokers_store || [];
                this.totalCartasUsadas = data.gameState.num_played_cards || this.manoJugador.length || 0;

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
    }
}

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.juego = new Juego());
    } else {
        window.juego = new Juego();
    }
}
