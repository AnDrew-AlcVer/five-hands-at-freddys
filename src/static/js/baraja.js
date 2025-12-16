let POWERUPS = [];
let powerupsSeleccionados = JSON.parse(localStorage.getItem('powerupsSeleccionados')) || [];

async function cargarPowerups() {
    try {
        const res = await fetch('/static/config/powerups.json');
        const data = await res.json();
        POWERUPS = data.powerups;
    } catch (error) {
        console.error('Error cargando powerups:', error);
    }
}

function renderizarBarajas() {
    const container = document.getElementById('barajasContainer');
    container.innerHTML = '';

    POWERUPS.forEach(powerup => {
        const estaSeleccionado = powerupsSeleccionados.length > 0 && powerupsSeleccionados[0].id === powerup.id;
        const div = document.createElement('div');
        div.className = `baraja-card ${estaSeleccionado ? 'selected' : ''}`;
        div.onclick = () => togglePowerup(powerup);

        div.innerHTML = `
            <div class="baraja-card-inner">
                <div class="baraja-card-front">
                    <img src="${powerup.image}" alt="${powerup.nombre}" class="baraja-imagen">
                    <div class="baraja-overlay">
                        <h5>${powerup.nombre}</h5>
                    </div>
                </div>
                <div class="baraja-card-back">
                    <p class="baraja-descripcion">${powerup.descripcion}</p>
                </div>
            </div>
        `;

        container.appendChild(div);
    });

    actualizarInfoPowerups();
}

function togglePowerup(powerup) {
    const index = powerupsSeleccionados.findIndex(p => p.id === powerup.id);
    
    if (index >= 0) {
        powerupsSeleccionados = [];
        localStorage.removeItem('barajaSeleccionada');
    } else {
        powerupsSeleccionados = [powerup];
        // Guardar el id de la baraja seleccionada
        localStorage.setItem('barajaSeleccionada', powerup.id);
    }

    localStorage.setItem('powerupsSeleccionados', JSON.stringify(powerupsSeleccionados));
    renderizarBarajas();
}

function actualizarInfoPowerups() {
    const btn = document.getElementById('continuarBtn');
    btn.disabled = false;
}

function continuarConBaraja() {
    if (powerupsSeleccionados.length === 0) {
        window.location.href = '/menu';
    } else {
        localStorage.setItem('powerupsSeleccionados', JSON.stringify(powerupsSeleccionados));
        window.location.href = '/juego?modo=nueva';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await cargarPowerups();
    renderizarBarajas();
});
