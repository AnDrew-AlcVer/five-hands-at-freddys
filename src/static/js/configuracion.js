let volumenMusica = localStorage.getItem('volumenMusica') ? parseInt(localStorage.getItem('volumenMusica')) : 50;
let volumenEfectos = localStorage.getItem('volumenEfectos') ? parseInt(localStorage.getItem('volumenEfectos')) : 50;

function obtenerVolumenMusica() {
    return volumenMusica / 100;
}

function obtenerVolumenEfectos() {
    return volumenEfectos / 100;
}

function guardarVolumenMusica(valor) {
    volumenMusica = parseInt(valor);
    localStorage.setItem('volumenMusica', volumenMusica);
    return volumenMusica / 100;
}

function guardarVolumenEfectos(valor) {
    volumenEfectos = parseInt(valor);
    localStorage.setItem('volumenEfectos', volumenEfectos);
    return volumenEfectos / 100;
}

function abrirConfiguracion() {
    const html = `
        <div id="configModal" class="config-modal-overlay">
            <div class="config-modal-content">
                <div class="config-modal-header">
                    <h2>⚙️ Configuración de Audio</h2>
                </div>
                
                <div class="config-modal-body">
                    <div class="config-control">
                        <label for="volumeMusic" class="config-label">🎵 Volumen Música</label>
                        <div class="volume-row">
                            <input type="range" id="volumeMusic" class="volume-slider" min="0" max="100" value="${volumenMusica}">
                            <span class="volume-percent" id="musicPercent">${volumenMusica}%</span>
                        </div>
                    </div>

                    <div class="config-control">
                        <label for="volumeEffects" class="config-label">🔊 Volumen Efectos</label>
                        <div class="volume-row">
                            <input type="range" id="volumeEffects" class="volume-slider" min="0" max="100" value="${volumenEfectos}">
                            <span class="volume-percent" id="effectsPercent">${volumenEfectos}%</span>
                        </div>
                    </div>
                </div>

                <div class="config-modal-footer">
                    <button class="config-btn-close" onclick="cerrarConfiguracion()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.id = 'configContainer';
    container.innerHTML = html;
    document.body.appendChild(container);
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/templates/css/configuracion.css';
    document.head.appendChild(link);
    
    document.getElementById('volumeMusic').addEventListener('input', (e) => {
        const valor = e.target.value;
        guardarVolumenMusica(valor);
        document.getElementById('musicPercent').textContent = valor + '%';
        
        if (window.soundMenu) {
            window.soundMenu.volume = obtenerVolumenMusica();
        }
        if (window.musicaJuego) {
            window.musicaJuego.volume = obtenerVolumenMusica();
        }
    });
    
    document.getElementById('volumeEffects').addEventListener('input', (e) => {
        const valor = e.target.value;
        guardarVolumenEfectos(valor);
        document.getElementById('effectsPercent').textContent = valor + '%';
        
        if (window.sonidoGanador) {
            window.sonidoGanador.volume = obtenerVolumenEfectos();
        }
        if (window.sonidoPerder) {
            window.sonidoPerder.volume = obtenerVolumenEfectos();
        }
    });
    
    document.getElementById('configModal').addEventListener('click', (e) => {
        if (e.target.id === 'configModal') {
            cerrarConfiguracion();
        }
    });
}

function cerrarConfiguracion() {
    const container = document.getElementById('configContainer');
    if (container) {
        container.remove();
    }
}
