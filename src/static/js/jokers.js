class GestorJokers {
    constructor(juego) {
        this.juego = juego;
    }

    async abrirTienda() {
        if (!this.juego.estadoJuego) {
            let intentos = 0;
            while (!this.juego.estadoJuego && intentos < 30) {
                await new Promise(resolve => setTimeout(resolve, 100));
                intentos++;
            }
            if (!this.juego.estadoJuego) return;
        }
        
        if (!this.juego.estadoJuego.shopOpened) {
            const respuesta = await fetch('/game/obtener_jokers_tienda', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameState: this.juego.estadoJuego })
            });
            
            const resultado = await respuesta.json();
            
            if (resultado.success) {
                this.juego.jokersTienda = resultado.jokers;
                this.juego.estadoJuego = resultado.gameState;
            } else {
                return;
            }
        }
        
        this.mostrarModalTienda();
    }

    mostrarModalTienda() {
        const modal = document.createElement('div');
        modal.id = 'shopModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.cerrarTienda();
            }
        });
        
        const contenidoModal = document.createElement('div');
        contenidoModal.style.cssText = `
            background: linear-gradient(180deg, #1a1a3e 0%, #2d1b69 100%);
            border: 3px solid #ffaa44;
            border-radius: 20px;
            padding: 30px;
            max-width: 800px;
            width: 90%;
        `;
        
        let html = `
            <h2 style="text-align: center; color: #f7931e; font-size: 2em; margin-bottom: 20px;">TIENDA DE JOKERS</h2>
            <p style="text-align: center; color: #ccc; margin-bottom: 30px;">Dinero disponible: $${this.juego.estadoJuego.money}</p>
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
        `;
        
        this.juego.jokersTienda.forEach(joker => {
            const puedeComprar = this.juego.estadoJuego.money >= joker.price;
            const yaComprado = this.juego.jokersPropiedad.some(j => j.id === joker.id);
            
            // ✅ Mostrar imagen si existe, si no mostrar emoji (60px para coincidir con el área de juego)
            const contenidoVisual = joker.image 
                ? `<img src="${joker.image}" alt="${joker.name}" style="width: 60px; height: auto; object-fit: contain; border-radius: 5px; margin-bottom: 15px;">`
                : `<div style="font-size: 3em; margin-bottom: 10px;">🃏</div>`;
            
            html += `
                <div class="shop-joker-card" style="
                    background: linear-gradient(145deg, rgba(155,89,182,0.3), rgba(142,68,173,0.4));
                    border: 3px solid ${yaComprado ? '#27ae60' : '#8e44ad'};
                    border-radius: 15px;
                    padding: 20px;
                    width: 300px;
                    text-align: center;
                    ${!puedeComprar && !yaComprado ? 'opacity: 0.5;' : ''}
                ">
                    ${contenidoVisual}
                    <h3 style="color: #9b59b6; margin-bottom: 10px;">${joker.name}</h3>
                    <p style="color: #ccc; margin-bottom: 15px; font-size: 0.9em;">${joker.description}</p>
                    <p style="color: #f1c40f; font-size: 1.3em; font-weight: bold; margin-bottom: 15px;">$${joker.price}</p>
                    ${yaComprado ? 
                        '<button disabled style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: not-allowed;">COMPRADO</button>' :
                        `<button onclick="window.juego.gestorJokers.comprarJoker('${joker.id}')" 
                            ${!puedeComprar ? 'disabled' : ''} 
                            style="background: ${puedeComprar ? 'linear-gradient(45deg, #27ae60, #2ecc71)' : '#666'}; 
                            color: white; border: none; padding: 10px 20px; border-radius: 8px; 
                            cursor: ${puedeComprar ? 'pointer' : 'not-allowed'}; font-weight: bold;">
                            ${puedeComprar ? 'COMPRAR' : 'SIN DINERO'}
                        </button>`
                    }
                </div>
            `;
        });
        
        html += `
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.juego.gestorJokers.cerrarTienda()" style="
                    background: linear-gradient(45deg, #e74c3c, #c0392b);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 10px;
                    font-size: 1.1em;
                    font-weight: bold;
                    cursor: pointer;
                ">CERRAR TIENDA</button>
            </div>
        `;
        
        contenidoModal.innerHTML = html;
        modal.appendChild(contenidoModal);
        document.body.appendChild(modal);
    }

    comprarJoker(joker_id) {
        // Encontrar el joker en la tienda por ID
        const joker = this.juego.jokersTienda.find(j => j.id === joker_id);
        if (!joker) return;
        
        if (this.juego.estadoJuego.money < joker.price) return;
        
        if (this.juego.jokersPropiedad.length >= 5) return;
        
        // Agregar joker a la propiedad
        this.juego.jokersPropiedad.push(joker);
        this.juego.estadoJuego.money -= joker.price;
        this.juego.jokersTienda = this.juego.jokersTienda.filter(j => j.id !== joker_id);
        
        // Actualizar UI
        this.renderizarJokers();
        this.actualizarTienda();
        this.juego.actualizarUI();
        
        // Guardar en base de datos
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
        }).catch(() => {});
    }

    actualizarTienda() {
        const modal = document.getElementById('shopModal');
        if (!modal) return;
        
        const contenidoModal = modal.querySelector('div:last-child');
        
        let html = `
            <h2 style="text-align: center; color: #f7931e; font-size: 2em; margin-bottom: 20px;">TIENDA DE JOKERS</h2>
            <p style="text-align: center; color: #ccc; margin-bottom: 30px;">Dinero disponible: $${this.juego.estadoJuego.money}</p>
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
        `;
        
        this.juego.jokersTienda.forEach(joker => {
            const puedeComprar = this.juego.estadoJuego.money >= joker.price;
            const yaComprado = this.juego.jokersPropiedad.some(j => j.id === joker.id);
            
            // ✅ Mostrar imagen si existe, si no mostrar emoji (60px para coincidir con el área de juego)
            const contenidoVisual = joker.image 
                ? `<img src="${joker.image}" alt="${joker.name}" style="width: 60px; height: auto; object-fit: contain; border-radius: 5px; margin-bottom: 15px;">`
                : `<div style="font-size: 3em; margin-bottom: 10px;">🃏</div>`;
            
            html += `
                <div class="shop-joker-card" style="
                    background: linear-gradient(145deg, rgba(155,89,182,0.3), rgba(142,68,173,0.4));
                    border: 3px solid ${yaComprado ? '#27ae60' : '#8e44ad'};
                    border-radius: 15px;
                    padding: 20px;
                    width: 300px;
                    text-align: center;
                    ${!puedeComprar && !yaComprado ? 'opacity: 0.5;' : ''}
                ">
                    ${contenidoVisual}
                    <h3 style="color: #9b59b6; margin-bottom: 10px;">${joker.name}</h3>
                    <p style="color: #ccc; margin-bottom: 15px; font-size: 0.9em;">${joker.description}</p>
                    <p style="color: #f1c40f; font-size: 1.3em; font-weight: bold; margin-bottom: 15px;">$${joker.price}</p>
                    ${yaComprado ? 
                        '<button disabled style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: not-allowed;">COMPRADO</button>' :
                        `<button onclick="window.juego.gestorJokers.comprarJoker('${joker.id}')" 
                            ${!puedeComprar ? 'disabled' : ''} 
                            style="background: ${puedeComprar ? 'linear-gradient(45deg, #27ae60, #2ecc71)' : '#666'}; 
                            color: white; border: none; padding: 10px 20px; border-radius: 8px; 
                            cursor: ${puedeComprar ? 'pointer' : 'not-allowed'}; font-weight: bold;">
                            ${puedeComprar ? 'COMPRAR' : 'SIN DINERO'}
                        </button>`
                    }
                </div>
            `;
        });
        
        html += `
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.juego.gestorJokers.cerrarTienda()" style="
                    background: linear-gradient(45deg, #e74c3c, #c0392b);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 10px;
                    font-size: 1.1em;
                    font-weight: bold;
                    cursor: pointer;
                ">CERRAR TIENDA</button>
            </div>
        `;
        
        contenidoModal.innerHTML = html;
    }

    cerrarTienda() {
        const modal = document.getElementById('shopModal');
        if (modal) {
            modal.remove();
        }
    }

    renderizarJokers() {
        for (let i = 1; i <= 5; i++) {
            const slot = document.querySelector(`.joker-slot[data-joker="${i}"]`);
            const joker = this.juego.jokersPropiedad[i - 1];
            
            if (joker) {
                // ✅ Si el joker tiene imagen, mostrarla; si no, mostrar el emoji
                const contenidoVisual = joker.image 
                    ? `<img src="${joker.image}" alt="${joker.name}" style="width: 60px; height: auto; object-fit: contain; border-radius: 5px;">`
                    : `<div style="font-size: 3em; filter: none;">🃏</div>`;
                
                slot.innerHTML = `
                    <div style="text-align: center;">
                        ${contenidoVisual}
                        <div style="font-size: 0.8em; font-weight: bold; color: #9b59b6; margin-top: 5px;">${joker.name}</div>
                        <div style="font-size: 0.7em; color: #ccc; margin-top: 3px;">${joker.description}</div>
                    </div>
                `;
                slot.style.background = 'linear-gradient(145deg, rgba(155,89,182,0.6), rgba(142,68,173,0.7))';
                slot.style.borderColor = '#9b59b6';
                slot.style.borderStyle = 'solid';
            }
        }
    }
}
