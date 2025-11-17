window.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    await verificarPartidaGuardada();
    await cargarLeaderboard();

    const soundMenu = new Audio('/static/sound/menu.mp3');
    soundMenu.loop = true;
    soundMenu.volume = 0.5;
    soundMenu.play().catch(() => console.log('Esperando interacción del usuario para reproducir música'));

    const newGameBtn = document.querySelector('.btn.btn-menu.btn-lg');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            soundMenu.pause();
            nuevaPartida();
        });
    }

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            soundMenu.pause();
            continuarPartida();
        });
    }
});

async function verificarSesion() {
    try {
        const response = await fetch('/verificar_sesion');
        const data = await response.json();
        
        if (data.logged_in) {
            const username = data.user?.username || data.username || 'Usuario';
            document.getElementById('usernameDisplay').textContent = username;
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        window.location.href = '/login';
    }
}

async function verificarPartidaGuardada() {
    try {
        const response = await fetch('/verificar_partida_guardada');
        const data = await response.json();
        
        if (data.success && data.has_saved_game) {
            const continueBtn = document.getElementById('continueBtn');
            continueBtn.classList.remove('d-none');
            
            const gameInfo = data.game_info;
            continueBtn.innerHTML = `▶️ Continuar partida<br><small class="text-light-50">Puntuación: ${gameInfo.score} | Dinero: $${gameInfo.money}</small>`;
        }
    } catch (error) {
        console.error('Error verificando partida guardada:', error);
    }
}

// Cargar leaderboard
async function cargarLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
        const data = await response.json();
        
        if (data.success) {
            const leaderboardTable = document.getElementById('leaderboardList');
            
            if (data.leaderboard.length === 0) {
                leaderboardTable.innerHTML = '<tbody><tr><td colspan="3" class="text-center text-light py-4">No hay puntuaciones todavía</td></tr></tbody>';
                return;
            }
            
            // Crear tbody directamente
            let tbodyHTML = '<tbody>';
            
            data.leaderboard.forEach((player, index) => {
                const position = index + 1;
                let rankClass = '';
                let rankIcon = `#${position}`;
                
                // Clases especiales para top 3
                if (position === 1) {
                    rankClass = 'top1';
                    rankIcon = '🥇';
                } else if (position === 2) {
                    rankClass = 'top2';
                    rankIcon = '🥈';
                } else if (position === 3) {
                    rankClass = 'top3';
                    rankIcon = '🥉';
                } else {
                    // Alternar colores después del top 3
                    rankClass = (position % 2 === 0) ? 'row-even' : 'row-odd';
                }
                
                tbodyHTML += `
                    <tr class="${rankClass}">
                        <td class="text-center fw-bold fs-5">${rankIcon}</td>
                        <td class="text-warning fw-medium">${player.username}</td>
                        <td class="text-end">
                            <span class="badge rounded-pill bg-purple-gradient fs-6 px-3 py-2">${player.score}</span>
                        </td>
                    </tr>
                `;
            });
            
            tbodyHTML += '</tbody>';
            leaderboardTable.innerHTML = tbodyHTML;
        }
    } catch (error) {
        console.error('Error cargando leaderboard:', error);
        document.getElementById('leaderboardList').innerHTML = '<tbody><tr><td colspan="3" class="text-center text-light py-4">Error al cargar</td></tr></tbody>';
    }
}

// Nueva partida
function nuevaPartida() {
    window.location.href = '/juego';
}

// Continuar partida
function continuarPartida() {
    window.location.href = '/juego';
}

// Ver baraja
function verBaraja() {
    // Sin acción por ahora
}

// Configuración
function configuracion() {
    // Sin acción por ahora
}

// Cerrar sesión
async function cerrarSesion() {
    try {
        await fetch('/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (error) {
        console.error('Error cerrando sesión:', error);
    }
}
