class AccionesJuego {
    constructor(juego) {
        this.juego = juego;
    }

    async jugarCartasSeleccionadas() {
        if (this.juego.cartasSeleccionadas.length === 0 || this.juego.estadoJuego.hands <= 0) return;
        
        const cartasJugar = this.juego.cartasSeleccionadas.map(id => 
            this.juego.manoJugador.find(carta => carta.id === id)
        );
        
        try {
            const respuesta = await fetch('/jugar_cartas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cards: cartasJugar,
                    gameState: this.juego.estadoJuego
                })
            });
            
            const resultado = await respuesta.json();
            
            if (resultado.success) {
                this.juego.estadoJuego = resultado.gameState;
                this.manejarExitoJugarCartas(cartasJugar, resultado);
            }
        } catch (error) {
            this.manejarJugarCartasLocal(cartasJugar);
        }
    }

    manejarExitoJugarCartas(cartasJugar, resultado) {
        this.juego.gestorCartas.moverCartasAreaJuego(cartasJugar);
        this.juego.actualizarUI();
        this.juego.actualizarBotonJugar();
        this.juego.limpiarSeleccion();
        this.juego.gestorCartas.removerCartasDeMano(cartasJugar);
        this.juego.gestorCartas.robarNuevasCartas(cartasJugar.length);

        if (resultado.roundWon) {
            setTimeout(() => {
                this.mostrarMensajeVictoria();
            }, 2000);
        } else {
            setTimeout(() => {
                this.juego.gestorCartas.limpiarCartasJugadasConAnimacion();
            }, 2000);
        }

        (async () => {
            const r = await fetch('/guardar_partida', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameState: this.juego.estadoJuego,
                    actual_hand: this.juego.manoJugador,
                    played_cards: this.juego.cartasJugadas,
                    num_played_cards: this.juego.totalCartasUsadas,
                    purchased_jokers: this.juego.jokersPropiedad,
                    open_store: this.juego.estadoJuego.shopOpened || false,
                    jokers_store: this.juego.jokersTienda
                })
            }).catch(() => {});
        })();
    }

    mostrarMensajeVictoria() {
        const mensaje = document.createElement('div');
        mensaje.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #2ecc71, #27ae60);
            color: white;
            padding: 40px 60px;
            border-radius: 20px;
            font-size: 2.5em;
            font-weight: bold;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            border: 3px solid #fff;
        `;
        mensaje.innerHTML = `
            🎉 ¡RONDA GANADA! 🎉<br>
            <span style="font-size: 0.5em; display: block; margin-top: 15px;">
                Objetivo superado: ${this.juego.estadoJuego.score} / ${this.juego.estadoJuego.blindTarget}
            </span>
        `;
        document.body.appendChild(mensaje);

        setTimeout(() => {
            mensaje.remove();
            this.avanzarRonda();
        }, 3000);
    }
    
    async avanzarRonda() {
        const nextRound = (this.juego.estadoJuego.round || 1) + 1;
        
        const respuesta = await fetch('/inicializar_juego', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ round: nextRound })
        });
        
        const resultado = await respuesta.json();
        if (resultado.success) {
            this.juego.estadoJuego = resultado.gameState;
            this.juego.manoJugador = resultado.hand.map((carta, indice) => ({
                ...carta,
                id: indice
            }));
            this.juego.totalCartasUsadas = this.juego.manoJugador.length;
            this.juego.cartasJugadas = [];
            this.juego.gestorCartas.renderizarManoJugador();
            this.juego.gestorCartas.limpiarCartasJugadas();
            this.juego.actualizarUI();
        }
    }

    manejarJugarCartasLocal(cartasJugar) {
        this.juego.gestorCartas.moverCartasAreaJuego(cartasJugar);
        
        const puntuacionBase = cartasJugar.length * 10;
        this.juego.estadoJuego.score += puntuacionBase;
        this.juego.estadoJuego.hands -= 1;
        
        this.juego.actualizarUI();
        this.juego.actualizarBotonJugar();
        this.juego.limpiarSeleccion();
        this.juego.gestorCartas.removerCartasDeMano(cartasJugar);
        this.juego.gestorCartas.robarNuevasCartas(cartasJugar.length);
        
        setTimeout(() => {
            this.juego.gestorCartas.limpiarCartasJugadasConAnimacion();
        }, 2000);
    }

    async descartarCartasSeleccionadas() {
        if (this.juego.cartasSeleccionadas.length === 0 || this.juego.estadoJuego.discards <= 0) return;
        
        const cartasDescartar = this.juego.cartasSeleccionadas.map(id => 
            this.juego.manoJugador.find(carta => carta.id === id)
        );
        
        this.juego.cartasSeleccionadas.forEach((idCarta, indice) => {
            const elementoCarta = document.querySelector(`[data-card-id="${idCarta}"]`);
            if (elementoCarta) {
                setTimeout(() => {
                    elementoCarta.style.transition = 'all 0.4s ease-out';
                    elementoCarta.style.transform = 'translateY(-50px) scale(0.5) rotate(15deg)';
                    elementoCarta.style.opacity = '0';
                }, indice * 80);
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, cartasDescartar.length * 80 + 400));
        
        try {
            const respuesta = await fetch('/descartar_cartas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cards: cartasDescartar,
                    gameState: this.juego.estadoJuego
                })
            });
            
            const resultado = await respuesta.json();
            
            if (resultado.success) {
                this.juego.estadoJuego = resultado.gameState;
                this.juego.actualizarUI();
                this.juego.limpiarSeleccion();
                this.juego.gestorCartas.removerCartasDeMano(cartasDescartar);
                await this.juego.gestorCartas.robarNuevasCartasConAnimacion(cartasDescartar.length);
            }
        } catch (error) {
            console.error('❌ Error de conexión con el servidor:', error);
        }
    }

    async nuevaRonda() {
        this.juego.gestorCartas.limpiarAreaJuego();
        this.juego.estadoJuego.hands = 4;
        this.juego.estadoJuego.discards = 4;
        await this.juego.generarManoJugador();
        this.juego.actualizarUI();
    }
}
