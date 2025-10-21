class Game {
    constructor() {
        this.selectedCards = [];
        this.playerHand = [];
        this.playedCards = [];
        this.gameState = null;
        this.shopJokers = [];
        this.ownedJokers = [];
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    async initializeGame() {
        await this.generatePlayerHand();
        this.updateUI();
    }
    
    setupEventListeners() {
        const playButton = document.getElementById('playCardsBtn');
        const discardButton = document.getElementById('discardBtn');
        
        playButton.addEventListener('click', () => this.playSelectedCards());
        discardButton.addEventListener('click', () => this.discardSelectedCards());
        
        // Botón abrir tienda
        const shopButton = document.querySelector('.shop-header');
        shopButton.style.cursor = 'pointer';
        shopButton.addEventListener('click', () => this.openShop());
    }
    
    async generatePlayerHand() {
        try {
            const response = await fetch('/init_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.gameState = result.gameState;
                this.playerHand = result.hand.map((card, index) => ({
                    ...card,
                    id: index
                }));
                this.renderPlayerHand();
            }
        } catch (error) {
        }
    }
    
    renderPlayerHand() {
        const handContainer = document.getElementById('playerHand');
        handContainer.innerHTML = '';
        
        this.playerHand.forEach(card => {
            const cardElement = this.createCardElement(card);
            handContainer.appendChild(cardElement);
        });
    }
    
    createCardElement(card, isPlayedCard = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.color}`;
        cardDiv.dataset.cardId = card.id;
        
        cardDiv.innerHTML = `
            <div class="card-top">
                <span class="card-value">${card.value}</span>
                <span class="card-suit">${card.suit}</span>
            </div>
            <div class="card-center">
                <span class="card-center-symbol">${card.suit}</span>
            </div>
            <div class="card-bottom">
                <span class="card-value">${card.value}</span>
                <span class="card-suit">${card.suit}</span>
            </div>
        `;
        
        if (!isPlayedCard) {
            cardDiv.addEventListener('click', () => this.toggleCardSelection(card.id));
        } else {
            cardDiv.style.cursor = 'default';
        }
        
        return cardDiv;
    }
    
    toggleCardSelection(cardId) {
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        const isSelected = this.selectedCards.includes(cardId);
        
        if (isSelected) {
            this.selectedCards = this.selectedCards.filter(id => id !== cardId);
            cardElement.classList.remove('selected');
        } else {
            if (this.selectedCards.length < 5) {
                this.selectedCards.push(cardId);
                cardElement.classList.add('selected');
            }
        }
        
        this.updatePlayButton();
    }
    
    updatePlayButton() {
        const playButton = document.getElementById('playCardsBtn');
        const selectionCount = document.getElementById('selectionCount');
        
        playButton.disabled = this.selectedCards.length === 0 || this.gameState.hands <= 0;
        
        if (this.gameState.hands <= 0) {
            playButton.textContent = 'NO QUEDAN MANOS';
        } else if (this.selectedCards.length > 0) {
            playButton.textContent = `JUGAR ${this.selectedCards.length} CARTA${this.selectedCards.length > 1 ? 'S' : ''}`;
        } else {
            playButton.textContent = 'JUGAR CARTAS';
        }
        
        selectionCount.textContent = `${this.selectedCards.length}/5 cartas seleccionadas`;
        
        if (this.selectedCards.length === 5) {
            selectionCount.style.color = '#e74c3c';
        } else if (this.selectedCards.length > 0) {
            selectionCount.style.color = '#f1c40f';
        } else {
            selectionCount.style.color = '#f1c40f';
        }
    }
    
    async playSelectedCards() {
        if (this.selectedCards.length === 0 || this.gameState.hands <= 0) return;
        
        const cardsToPlay = this.selectedCards.map(id => 
            this.playerHand.find(card => card.id === id)
        );
        
        try {
            const response = await fetch('/play_cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cards: cardsToPlay,
                    gameState: this.gameState
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.gameState = result.gameState;
                this.handlePlayCardsSuccess(cardsToPlay, result);
            }
        } catch (error) {
            this.handlePlayCardsLocal(cardsToPlay);
        }
    }
    
    handlePlayCardsSuccess(cardsToPlay, result) {
        this.moveCardsToPlayArea(cardsToPlay);
        this.updateUI();
        this.updatePlayButton();
        this.clearSelection();
        this.removeCardsFromHand(cardsToPlay);
        this.drawNewCards(cardsToPlay.length);
        
        setTimeout(() => {
            this.clearPlayedCardsWithAnimation();
        }, 2000);
    }
    
    handlePlayCardsLocal(cardsToPlay) {
        this.moveCardsToPlayArea(cardsToPlay);
        
        const baseScore = cardsToPlay.length * 10;
        this.gameState.score += baseScore;
        this.gameState.hands -= 1;
        
        this.updateUI();
        this.updatePlayButton();
        this.clearSelection();
        this.removeCardsFromHand(cardsToPlay);
        this.drawNewCards(cardsToPlay.length);
        
        setTimeout(() => {
            this.clearPlayedCardsWithAnimation();
        }, 2000);
    }
    
    moveCardsToPlayArea(cards) {
        const playArea = document.getElementById('playedCards');
        const placeholder = playArea.querySelector('.play-area-placeholder');
        
        if (placeholder) {
            placeholder.remove();
        }
        
        playArea.classList.add('has-cards');
        playArea.innerHTML = '';
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                const cardElement = this.createCardElement(card, true); // true = carta jugada, no seleccionable
                cardElement.classList.add('played-card');
                playArea.appendChild(cardElement);
            }, index * 100);
        });
        
        this.playedCards = [...cards];
    }
    
    removeCardsFromHand(cardsToRemove) {
        const idsToRemove = cardsToRemove.map(card => card.id);
        this.playerHand = this.playerHand.filter(card => !idsToRemove.includes(card.id));
        this.renderPlayerHand();
    }
    
    clearSelection() {
        this.selectedCards = [];
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        this.updatePlayButton();
    }
    
    async discardSelectedCards() {
        if (this.selectedCards.length === 0 || this.gameState.discards <= 0) return;
        
        const cardsToDiscard = this.selectedCards.map(id => 
            this.playerHand.find(card => card.id === id)
        );
        
        this.selectedCards.forEach((cardId, index) => {
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
                setTimeout(() => {
                    cardElement.style.transition = 'all 0.4s ease-out';
                    cardElement.style.transform = 'translateY(-50px) scale(0.5) rotate(15deg)';
                    cardElement.style.opacity = '0';
                }, index * 80);
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, cardsToDiscard.length * 80 + 400));
        
        try {
            const response = await fetch('/discard_cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cards: cardsToDiscard,
                    gameState: this.gameState
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.gameState = result.gameState;
                this.updateUI();
                this.clearSelection();
                this.removeCardsFromHand(cardsToDiscard);
                await this.drawNewCardsWithAnimation(cardsToDiscard.length);
            }
        } catch (error) {
            alert('Error de conexión con el servidor');
        }
    }
    
    async drawNewCards(count) {
        try {
            const response = await fetch('/draw_cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    count: count,
                    playedCards: this.playedCards,
                    currentHand: this.playerHand
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.cards.length > 0) {
                const maxId = Math.max(...this.playerHand.map(c => c.id), 0);
                const newCards = result.cards.map((card, index) => ({
                    ...card,
                    id: maxId + 1 + index
                }));
                
                this.playerHand.push(...newCards);
                this.renderPlayerHand();
            }
        } catch (error) {
        }
    }
    
    async drawNewCardsWithAnimation(count) {
        try {
            const response = await fetch('/draw_cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    count: count,
                    playedCards: this.playedCards,
                    currentHand: this.playerHand
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.cards.length > 0) {
                const maxId = Math.max(...this.playerHand.map(c => c.id), 0);
                const newCards = result.cards.map((card, index) => ({
                    ...card,
                    id: maxId + 1 + index
                }));
                
                this.playerHand.push(...newCards);
                this.renderPlayerHand();
                
                const handContainer = document.getElementById('playerHand');
                const allCards = handContainer.querySelectorAll('.card');
                const newCardElements = Array.from(allCards).slice(-newCards.length);
                
                newCardElements.forEach((card, index) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(50px) scale(0.5)';
                    
                    setTimeout(() => {
                        card.style.transition = 'all 0.4s ease-out';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0) scale(1)';
                    }, index * 100);
                });
            }
        } catch (error) {
        }
    }
    
    updateUI() {
        document.querySelector('.round-score .score').textContent = this.gameState.score;
        document.querySelector('.stat-item.blue .value').textContent = this.gameState.hands;
        document.querySelector('.stat-item.red .value').textContent = this.gameState.discards;
        document.querySelector('.money .amount').textContent = `$${this.gameState.money}`;
        
        const totalUsed = this.playerHand.length + this.playedCards.length;
        const cardsRemaining = 52 - totalUsed;
        document.querySelector('.deck-count').textContent = `${cardsRemaining}/52`;
    }
    
    clearPlayArea() {
        const playArea = document.getElementById('playedCards');
        playArea.classList.remove('has-cards');
        playArea.innerHTML = '<div class="play-area-placeholder"><p>Área de cartas jugadas</p></div>';
        this.playedCards = [];
    }
    
    clearPlayedCardsWithAnimation() {
        const playArea = document.getElementById('playedCards');
        const cards = playArea.querySelectorAll('.played-card');
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease-out';
                card.style.transform = 'scale(0) rotate(180deg)';
                card.style.opacity = '0';
            }, index * 50);
        });
        
        setTimeout(() => {
            this.clearPlayArea();
        }, cards.length * 50 + 300);
    }
    
    async newRound() {
        this.clearPlayArea();
        this.gameState.hands = 4;
        this.gameState.discards = 4;
        await this.generatePlayerHand();
        this.updateUI();
    }
    
    async openShop() {
        if (!this.gameState.shopOpened) {
            try {
                const response = await fetch('/get_shop_jokers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        gameState: this.gameState
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.shopJokers = result.jokers;
                    this.gameState = result.gameState;
                } else {
                    alert(result.message);
                    return;
                }
            } catch (error) {
                return;
            }
        }
        
        this.showShopModal();
    }
    
    showShopModal() {
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
                this.closeShop();
            }
        });
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(180deg, #1a1a3e 0%, #2d1b69 100%);
            border: 3px solid #ffaa44;
            border-radius: 20px;
            padding: 30px;
            max-width: 800px;
            width: 90%;
        `;
        
        let html = `
            <h2 style="text-align: center; color: #f7931e; font-size: 2em; margin-bottom: 20px;">TIENDA DE JOKERS</h2>
            <p style="text-align: center; color: #ccc; margin-bottom: 30px;">Dinero disponible: $${this.gameState.money}</p>
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
        `;
        
        this.shopJokers.forEach(joker => {
            const canAfford = this.gameState.money >= joker.price;
            const alreadyOwned = this.ownedJokers.some(j => j.id === joker.id);
            
            html += `
                <div class="shop-joker-card" style="
                    background: linear-gradient(145deg, rgba(155,89,182,0.3), rgba(142,68,173,0.4));
                    border: 3px solid ${alreadyOwned ? '#27ae60' : '#8e44ad'};
                    border-radius: 15px;
                    padding: 20px;
                    width: 300px;
                    text-align: center;
                    ${!canAfford && !alreadyOwned ? 'opacity: 0.5;' : ''}
                ">
                    <div style="font-size: 3em; margin-bottom: 10px;">🃏</div>
                    <h3 style="color: #9b59b6; margin-bottom: 10px;">${joker.name}</h3>
                    <p style="color: #ccc; margin-bottom: 15px; font-size: 0.9em;">${joker.description}</p>
                    <p style="color: #f1c40f; font-size: 1.3em; font-weight: bold; margin-bottom: 15px;">$${joker.price}</p>
                    ${alreadyOwned ? 
                        '<button disabled style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: not-allowed;">COMPRADO</button>' :
                        `<button onclick="window.game.buyJoker('${joker.id}')" 
                            ${!canAfford ? 'disabled' : ''} 
                            style="background: ${canAfford ? 'linear-gradient(45deg, #27ae60, #2ecc71)' : '#666'}; 
                            color: white; border: none; padding: 10px 20px; border-radius: 8px; 
                            cursor: ${canAfford ? 'pointer' : 'not-allowed'}; font-weight: bold;">
                            ${canAfford ? 'COMPRAR' : 'SIN DINERO'}
                        </button>`
                    }
                </div>
            `;
        });
        
        html += `
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="window.game.closeShop()" style="
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
        
        modalContent.innerHTML = html;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }
    
    buyJoker(jokerId) {
        const joker = this.shopJokers.find(j => j.id === jokerId);
        
        if (!joker) return;
        
        if (this.gameState.money < joker.price) {
            alert('No tienes suficiente dinero');
            return;
        }
        
        if (this.ownedJokers.length >= 5) {
            alert('Ya tienes 5 jokers. No puedes comprar más.');
            return;
        }
        
        this.gameState.money -= joker.price;
        this.ownedJokers.push(joker);
        
        this.updateUI();
        this.renderJokers();
        
        this.closeShop();
        this.showShopModal();
    }
    
    closeShop() {
        const modal = document.getElementById('shopModal');
        if (modal) {
            modal.remove();
        }
    }
    
    renderJokers() {
        for (let i = 1; i <= 5; i++) {
            const slot = document.querySelector(`.joker-slot[data-joker="${i}"]`);
            const joker = this.ownedJokers[i - 1];
            
            if (joker) {
                slot.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 3em; filter: none;">🃏</div>
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

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});