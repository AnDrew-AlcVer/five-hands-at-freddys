class GestorObjetivos {
    constructor() {
        this.objetivos = null;
        this.ronda_actual = 1;
    }

    async cargarObjetivos() {
        try {
            const response = await fetch('/game/obtener_objetivos', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Error al cargar objetivos:', response.status);
                return false;
            }

            const data = await response.json();
            if (data.success) {
                this.objetivos = data.objetivos;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en cargarObjetivos:', error);
            return false;
        }
    }

    obtenerRonda(numero) {
        if (!this.objetivos || !this.objetivos.rondas) return null;
        return this.objetivos.rondas.find(r => r.numero === numero);
    }

    obtenerObjetivoActual() {
        return this.obtenerRonda(this.ronda_actual);
    }

    obtenerPuntosMinimos(numero_ronda) {
        const ronda = this.obtenerRonda(numero_ronda);
        return ronda ? ronda.puntos : 0;  // ✅ Cambiar de puntos_minimos a puntos
    }

    obtenerDescripcion(numero_ronda) {
        const ronda = this.obtenerRonda(numero_ronda);
        return ronda ? ronda.descripcion : '';
    }

    obtenerNombreRonda(numero_ronda) {
        const ronda = this.obtenerRonda(numero_ronda);
        return ronda ? ronda.nombre : `Ronda ${numero_ronda}`;
    }

    async validarRonda(numero_ronda, puntuacion) {
        try {
            const response = await fetch('/game/validar_ronda', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    numero_ronda: numero_ronda,
                    puntuacion: puntuacion
                })
            });

            if (!response.ok) {
                console.error('Error al validar ronda:', response.status);
                return null;
            }

            const data = await response.json();
            if (data.success) {
                return data;
            }
            return null;
        } catch (error) {
            console.error('Error en validarRonda:', error);
            return null;
        }
    }

    mostrarObjetivoActual() {
        const ronda = this.obtenerObjetivoActual();
        if (!ronda) return;

        const container = document.getElementById('objetivo-container');
        if (!container) return;

        container.innerHTML = `
            <div class="objetivo-box">
                <h2>Noche ${ronda.numero}</h2>
                <div class="puntos-objetivo">
                    <span>Puntos necesarios: <strong>${ronda.puntos}</strong></span>
                </div>
            </div>
        `;
    }

    mostrarResultado(resultado) {
        if (!resultado) return;

        const container = document.getElementById('resultado-container');
        if (!container) return;

        const claseResultado = resultado.aprobada ? 'victoria' : 'derrota';
        const icono = resultado.aprobada ? '✨' : '💀';

        container.innerHTML = `
            <div class="resultado-box ${claseResultado}">
                <div class="resultado-titulo">
                    ${icono} ${resultado.aprobada ? 'VICTORIA' : 'DERROTA'}
                </div>
                <p class="resultado-mensaje">${resultado.mensaje}</p>
                <div class="resultado-stats">
                    <div>Puntuación: <strong>${resultado.puntuacion}</strong></div>
                    <div>Requerida: <strong>${resultado.puntos_requeridos}</strong></div>
                    ${resultado.aprobada ? `<div>Recompensa: <strong>+${resultado.recompensa} pts</strong></div>` : ''}
                </div>
            </div>
        `;
    }

    mostrarMensajeFinal(victoria) {
        const mensajeObj = victoria ? 
            this.objetivos.mensajes_finales.victoria_total :
            this.objetivos.mensajes_finales.derrota_total;

        const container = document.getElementById('final-container');
        if (!container) return;

        const clase = victoria ? 'victoria-final' : 'derrota-final';

        container.innerHTML = `
            <div class="mensaje-final ${clase}">
                <h1 class="final-titulo">${mensajeObj.titulo}</h1>
                <p class="final-subtitulo">${mensajeObj.subtitulo}</p>
                <p class="final-mensaje">${mensajeObj.mensaje}</p>
            </div>
        `;
    }

    avanzarRonda() {
        if (this.ronda_actual < this.objetivos.configuracion.total_noches) {
            this.ronda_actual++;
            return true;
        }
        return false;
    }

    reiniciarRondas() {
        this.ronda_actual = 1;
    }

    obtenerTotalRondas() {
        return this.objetivos.configuracion.total_noches || 5;
    }

    estaEnUltimaRonda() {
        return this.ronda_actual === this.obtenerTotalRondas();
    }
}
