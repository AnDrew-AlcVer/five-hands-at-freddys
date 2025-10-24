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
        
        this.inicializarJuego();
        this.configurarEventos();
    }
    
    async inicializarJuego() {
        await this.generarManoJugador();
        this.actualizarUI();
    }
    
    configurarEventos() {
        const botonJugar = document.getElementById('playCardsBtn');
        const botonDescartar = document.getElementById('discardBtn');
        
        botonJugar.addEventListener('click', () => this.accionesJuego.jugarCartasSeleccionadas());
        botonDescartar.addEventListener('click', () => this.accionesJuego.descartarCartasSeleccionadas());
        
        const botonTienda = document.querySelector('.shop-header');
        botonTienda.style.cursor = 'pointer';
        botonTienda.addEventListener('click', () => this.gestorJokers.abrirTienda());
    }
    
    async generarManoJugador() {
        try {
            const respuesta = await fetch('/inicializar_juego', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const resultado = await respuesta.json();
            
            if (resultado.success) {
                this.estadoJuego = resultado.gameState;
                this.manoJugador = resultado.hand.map((carta, indice) => ({
                    ...carta,
                    id: indice
                }));
                this.totalCartasUsadas = this.manoJugador.length;
                this.gestorCartas.renderizarManoJugador();
            }
        } catch (error) {
        }
    }
    
    alternarSeleccionCarta(idCarta) {
        const elementoCarta = document.querySelector(`[data-card-id="${idCarta}"]`);
        const estaSeleccionada = this.cartasSeleccionadas.includes(idCarta);
        
        if (estaSeleccionada) {
            this.cartasSeleccionadas = this.cartasSeleccionadas.filter(id => id !== idCarta);
            elementoCarta.classList.remove('selected');
        } else {
            if (this.cartasSeleccionadas.length < 5) {
                this.cartasSeleccionadas.push(idCarta);
                elementoCarta.classList.add('selected');
            }
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
        document.querySelector('.round-score .score').textContent = this.estadoJuego.score;
        document.querySelector('.stat-item.blue .value').textContent = this.estadoJuego.hands;
        document.querySelector('.stat-item.red .value').textContent = this.estadoJuego.discards;
        document.querySelector('.money .amount').textContent = `$${this.estadoJuego.money}`;
        
        const cartasRestantes = 52 - this.totalCartasUsadas;
        document.querySelector('.deck-count').textContent = `${cartasRestantes}/52`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.juego = new Juego();
});
