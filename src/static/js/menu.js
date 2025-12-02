window.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    await verificarPartidaGuardada();
    await cargarLeaderboard();

    window.soundMenu = new Audio('/static/sound/menu.mp3');
    window.soundMenu.loop = true;
    window.soundMenu.volume = obtenerVolumenMusica();
    window.soundMenu.play().catch(() => console.log('Esperando interacción del usuario para reproducir música'));

    const newGameBtn = document.querySelector('.btn.btn-menu.btn-lg');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            window.soundMenu.pause();
            nuevaPartida();
        });
    }

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            window.soundMenu.pause();
            continuarPartida();
        });
    }

    const fondo = document.querySelector('body');
    const imagenes = [
        '/static/img/menu/menuBonnie.webp',
        '/static/img/menu/menuChica.png',
        '/static/img/menu/menuFoxy.webp',
        '/static/img/menu/menuFreddy.png'
    ];
    let indice = 0;

    const precarga = [];
    imagenes.forEach(src => {
        const img = new Image();
        img.src = src;
        precarga.push(img);
    });

    fondo.style.backgroundImage = `url('${imagenes[indice]}')`;
    fondo.style.backgroundSize = 'cover';
    fondo.style.backgroundPosition = 'center';
    fondo.style.transition = 'background-image 0.5s ease-in-out';

    setInterval(() => {
        indice = (indice + 1) % imagenes.length;
        fondo.style.backgroundImage = `url('${imagenes[indice]}')`;
    }, 5000);
});

async function verificarSesion() {
    try {
        const response = await fetch('/auth/verificar_sesion', {
            credentials: 'include'
        });
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
        const response = await fetch('/auth/verificar_partida_guardada', {
            credentials: 'include'
        });
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

async function cargarLeaderboard() {
    try {
        const response = await fetch('/auth/leaderboard');
        const data = await response.json();

        if (data.success) {
            const leaderboardTable = document.getElementById('leaderboardList');

            if (data.leaderboard.length === 0) {
                leaderboardTable.innerHTML = '<tbody><tr><td colspan="3" class="text-center text-light py-4">No hay puntuaciones todavía</td></tr></tbody>';
                return;
            }

            let tbodyHTML = '<tbody>';

            data.leaderboard.forEach((player, index) => {
                const position = index + 1;
                let rankClass = '';
                let rankIcon = `#${position}`;

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

function nuevaPartida() {
    window.location.href = '/juego?modo=nueva';
}

function continuarPartida() {
    window.location.href = '/juego?modo=continuar';
}

function verBaraja() {
    window.location.href = '/baraja';
}

function configuracion() {
    abrirConfiguracion();
}

async function cerrarSesion() {
    try {
        await fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login';
    } catch (error) {
        console.error('Error cerrando sesión:', error);
    }
}
