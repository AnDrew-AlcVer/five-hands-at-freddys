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
        
        setTimeout(() => {
            this.juego.gestorCartas.limpiarCartasJugadasConAnimacion();
        }, 2000);
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
            alert('Error de conexión con el servidor');
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
