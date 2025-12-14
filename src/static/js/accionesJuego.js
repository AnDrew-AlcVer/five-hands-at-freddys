let sonidoGanar = new Audio('/static/sound/ganar.mp3');
let sonidoPerder = new Audio('/static/sound/perder.mp3');

if (typeof window !== 'undefined') {
    window.sonidoGanador = sonidoGanar; // mantener nombre usado en configuracion.js
    window.sonidoPerder = sonidoPerder;
}

sonidoGanar.volume = obtenerVolumenEfectos();
sonidoPerder.volume = obtenerVolumenEfectos();

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
            const respuesta = await fetch('/game/jugar_cartas', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    played_cards: cartasJugar,
                    gameState: this.juego.estadoJuego,
                    actual_hand: this.juego.manoJugador,
                    all_played_cards: this.juego.cartasJugadas,
                    num_played_cards: this.juego.totalCartasUsadas,
                    purchased_jokers: this.juego.jokersPropiedad,
                    jokers_store: this.juego.jokersTienda
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
        
        setTimeout(() => {
            fetch('/game/guardar_partida', {
                method: 'POST',
                credentials: 'include',
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
            }).catch(() => { });
        }, 100);

        if (resultado.roundWon) {
            sonidoGanar.volume = obtenerVolumenEfectos();
            sonidoGanar.currentTime = 0;
            sonidoGanar.play();
            setTimeout(() => {
                this.mostrarMensajeVictoria();
            }, 2000);
        } else {
            const sinManos = this.juego.estadoJuego.hands <= 0;
            const noLlegaPuntaje = this.juego.estadoJuego.score < this.juego.estadoJuego.blindTarget;

            if (sinManos && noLlegaPuntaje) {
                sonidoPerder.volume = obtenerVolumenEfectos();
                sonidoPerder.currentTime = 0;
                sonidoPerder.play();
                setTimeout(() => {
                    this.mostrarMensajeDerrota();
                }, 2000);
                return;
            }

            setTimeout(() => {
                this.juego.gestorCartas.limpiarCartasJugadasConAnimacion();
            }, 2000);
        }
    }

    mostrarMensajeVictoria() {
        const currentRound = this.juego.estadoJuego.round || 1;
        const nextRound = currentRound + 1;
        const totalRondas = this.juego.gestorObjetivos?.objetivos?.rondas?.length || 5;
        const isLastRound = nextRound > totalRondas;

        const rondaActual = this.juego.gestorObjetivos?.objetivos?.rondas?.find(r => r.numero === currentRound);
        const recompensa = rondaActual?.recompensa || 0;

        this.juego.estadoJuego.money = (this.juego.estadoJuego.money || 0) + recompensa;
        
        const mensaje = isLastRound 
            ? (this.juego.gestorObjetivos?.objetivos?.mensajes?.victoria_final || '🏆 ¡GANASTE LAS CINCO NOCHES! 🏆')
            : (this.juego.gestorObjetivos?.objetivos?.mensajes?.victoria || '🎉 ¡Ronda superada! 🎉');
        
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, ${isLastRound ? '#f39c12' : '#2ecc71'}, ${isLastRound ? '#e67e22' : '#27ae60'});
            color: white;
            padding: 40px 60px;
            border-radius: 20px;
            font-size: 2em;
            font-weight: bold;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            border: 3px solid #fff;
        `;
        div.innerHTML = `
            ${mensaje}<br>
            <span style="font-size: 0.5em; display: block; margin-top: 15px;">
                Puntuación: ${this.juego.estadoJuego.score} / ${this.juego.estadoJuego.blindTarget}<br>
                💰 ¡Ganaste $${recompensa}!
            </span>
        `;
        document.body.appendChild(div);

        setTimeout(() => {
            div.remove();
            if (isLastRound) {
                this.borrarPartidaGuardada();
            } else {
                this.avanzarRonda();
            }
        }, 3000);
    }

    mostrarMensajeDerrota() {
        
        const mensaje_derrota = this.juego.gestorObjetivos?.objetivos?.mensajes?.derrota || '💀 ¡Ronda fallida! 💀';
        
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            color: white;
            padding: 40px 60px;
            border-radius: 20px;
            font-size: 2em;
            font-weight: bold;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            border: 3px solid #fff;
        `;
        div.innerHTML = `
            ${mensaje_derrota}<br>
            <span style="font-size: 0.5em; display: block; margin-top: 15px;">
                Puntuación alcanzada: ${this.juego.estadoJuego.score} / ${this.juego.estadoJuego.blindTarget}
            </span>
        `;
        document.body.appendChild(div);

        setTimeout(() => {
            div.remove();
            
            this.borrarPartidaGuardada();
        }, 4000);
    }

    async borrarPartidaGuardada() {
        try {
            await fetch('/game/borrar_partida_guardada', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Error borrando partida:', error);
        } finally {
            this.volver_al_menu();
        }
    }

    volver_al_menu() {
        pararMusicaJuego();
        localStorage.removeItem('powerupsSeleccionados');
        window.location.href = '/menu';
    }

    async avanzarRonda() {
        const nextRound = (this.juego.estadoJuego.round || 1) + 1;
        const moneyAcumulado = this.juego.estadoJuego.money || 0;  

        const respuesta = await fetch('/game/inicializar_juego', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                round: nextRound,
                played_cards: this.juego.cartasJugadas,  
                current_hand: this.juego.manoJugador     
            })
        });

        const resultado = await respuesta.json();
        if (resultado.success) {
            
            this.juego.estadoJuego = {
                ...resultado.gameState,
                hands: 4,
                discards: 4,
                score: 0,
                chips: 0,
                mult: 0,
                money: moneyAcumulado  
            };
            
            this.juego.estadoJuego = aplicarPowerups(this.juego.estadoJuego);
            
            this.juego.manoJugador = resultado.hand.map((carta, indice) => ({
                ...carta,
                id: indice
            }));
            this.juego.totalCartasUsadas = this.juego.manoJugador.length;
            this.juego.cartasJugadas = [];
            this.juego.cartasSeleccionadas = [];

            this.juego.gestorCartas.limpiarAreaJuego();  
            this.juego.gestorCartas.renderizarManoJugador();
            this.juego.actualizarUI();
            this.juego.actualizarBotonJugar();
            
            await fetch('/game/guardar_partida', {
                method: 'POST',
                credentials: 'include',
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
            }).catch(() => { });
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
            const respuesta = await fetch('/game/descartar_cartas', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    discarded_cards: cartasDescartar,
                    gameState: this.juego.estadoJuego,
                    actual_hand: this.juego.manoJugador,
                    all_played_cards: this.juego.cartasJugadas,
                    num_played_cards: this.juego.totalCartasUsadas,
                    purchased_jokers: this.juego.jokersPropiedad,
                    jokers_store: this.juego.jokersTienda
                })
            });

            const resultado = await respuesta.json();

            if (resultado.success) {
                this.juego.estadoJuego = resultado.gameState;
                this.juego.actualizarUI();
                this.juego.limpiarSeleccion();
                this.juego.gestorCartas.removerCartasDeMano(cartasDescartar);
                await this.juego.gestorCartas.robarNuevasCartasConAnimacion(cartasDescartar.length);
                
                setTimeout(() => {
                    fetch('/game/guardar_partida', {
                        method: 'POST',
                        credentials: 'include',
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
                    }).catch(() => { });
                }, 100);
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
