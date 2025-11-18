class GestorCartas {
    constructor(juego) {
        this.juego = juego;
    }

    crearElementoCarta(carta, esCartaJugada = false) {
        const divCarta = document.createElement('div');
        divCarta.className = `card ${carta.color}`;
        divCarta.dataset.cardId = carta.id;
        
        divCarta.innerHTML = `
            <div class="card-top">
                <span class="card-value">${carta.value}</span>
                <span class="card-suit">${carta.suit}</span>
            </div>
            <div class="card-center">
                <span class="card-center-symbol">${carta.suit}</span>
            </div>
            <div class="card-bottom">
                <span class="card-value">${carta.value}</span>
                <span class="card-suit">${carta.suit}</span>
            </div>
        `;
        
        if (!esCartaJugada) {
            divCarta.addEventListener('click', () => this.juego.alternarSeleccionCarta(carta.id));
        } else {
            divCarta.style.cursor = 'default';
        }
        
        return divCarta;
    }

    renderizarManoJugador() {
        const contenedorMano = document.getElementById('playerHand');
        if (!contenedorMano) return;
        
        contenedorMano.innerHTML = '';
        
        this.juego.manoJugador.forEach(carta => {
            const elementoCarta = this.crearElementoCarta(carta);
            contenedorMano.appendChild(elementoCarta);
        });
    }

    moverCartasAreaJuego(cartas) {
        const areaJuego = document.getElementById('playedCards');
        const placeholder = areaJuego.querySelector('.play-area-placeholder');
        
        if (placeholder) {
            placeholder.remove();
        }
        
        areaJuego.classList.add('has-cards');
        areaJuego.innerHTML = '';
        
        cartas.forEach((carta, indice) => {
            setTimeout(() => {
                const elementoCarta = this.crearElementoCarta(carta, true);
                elementoCarta.classList.add('played-card');
                areaJuego.appendChild(elementoCarta);
            }, indice * 100);
        });
        
        this.juego.cartasJugadas = [...cartas];
    }

    renderizarCartasJugadas(cartas) {
        
        const areaJuego = document.getElementById('playedCards');
        if (!areaJuego) return;
        
        areaJuego.classList.add('has-cards');
        areaJuego.innerHTML = '';
        
        cartas.forEach((carta) => {
            const elementoCarta = this.crearElementoCarta(carta, true);
            elementoCarta.classList.add('played-card');
            areaJuego.appendChild(elementoCarta);
        });
        
        this.juego.cartasJugadas = [...cartas];
    }

    removerCartasDeMano(cartasRemover) {
        const idsRemover = cartasRemover.map(carta => carta.id);
        this.juego.manoJugador = this.juego.manoJugador.filter(carta => !idsRemover.includes(carta.id));
        this.renderizarManoJugador();
    }

    limpiarAreaJuego() {
        const areaJuego = document.getElementById('playedCards');
        areaJuego.classList.remove('has-cards');
        areaJuego.innerHTML = '<div class="play-area-placeholder"><p>Área de cartas jugadas</p></div>';
        this.juego.cartasJugadas = [];
    }

    limpiarCartasJugadasConAnimacion() {
        const areaJuego = document.getElementById('playedCards');
        const cartas = areaJuego.querySelectorAll('.played-card');
        
        cartas.forEach((carta, indice) => {
            setTimeout(() => {
                carta.style.transition = 'all 0.3s ease-out';
                carta.style.transform = 'scale(0) rotate(180deg)';
                carta.style.opacity = '0';
            }, indice * 50);
        });
        
        setTimeout(() => {
            this.limpiarAreaJuego();
        }, cartas.length * 50 + 300);
    }

    async robarNuevasCartas(cantidad) {
        try {
            const respuesta = await fetch('/game/robar_cartas', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    count: cantidad,
                    playedCards: this.juego.cartasJugadas,
                    currentHand: this.juego.manoJugador
                })
            });
            
            const resultado = await respuesta.json();
            
            if (resultado.success && resultado.cards.length > 0) {
                const maxId = Math.max(...this.juego.manoJugador.map(c => c.id), 0);
                const nuevasCartas = resultado.cards.map((carta, indice) => ({
                    ...carta,
                    id: maxId + 1 + indice
                }));
                
                this.juego.manoJugador.push(...nuevasCartas);
                this.juego.totalCartasUsadas += nuevasCartas.length;
                this.renderizarManoJugador();
                this.juego.actualizarUI();
            }
        } catch (error) {
        }
    }

    async robarNuevasCartasConAnimacion(cantidad) {
        try {
            const respuesta = await fetch('/game/robar_cartas', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    count: cantidad,
                    playedCards: this.juego.cartasJugadas,
                    currentHand: this.juego.manoJugador
                })
            });
            
            const resultado = await respuesta.json();
            
            if (resultado.success && resultado.cards.length > 0) {
                const maxId = Math.max(...this.juego.manoJugador.map(c => c.id), 0);
                const nuevasCartas = resultado.cards.map((carta, indice) => ({
                    ...carta,
                    id: maxId + 1 + indice
                }));
                
                this.juego.manoJugador.push(...nuevasCartas);
                this.juego.totalCartasUsadas += nuevasCartas.length;
                this.renderizarManoJugador();
                this.juego.actualizarUI();
                
                const contenedorMano = document.getElementById('playerHand');
                const todasCartas = contenedorMano.querySelectorAll('.card');
                const elementosNuevos = Array.from(todasCartas).slice(-nuevasCartas.length);
                
                elementosNuevos.forEach((carta, indice) => {
                    carta.style.opacity = '0';
                    carta.style.transform = 'translateY(50px) scale(0.5)';
                    
                    setTimeout(() => {
                        carta.style.transition = 'all 0.4s ease-out';
                        carta.style.opacity = '1';
                        carta.style.transform = 'translateY(0) scale(1)';
                        
                        setTimeout(() => {
                            carta.style.removeProperty('opacity');
                            carta.style.removeProperty('transform');
                            carta.style.removeProperty('transition');
                        }, 400);
                    }, indice * 100);
                });
            }
        } catch (error) {
        }
    }
}
