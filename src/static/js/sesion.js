// Verificar sesión al cargar la página
async function verificarSesion() {
    try {
        const response = await fetch('/verificar_sesion', {
            method: 'GET',
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (!data.logged_in) {
            // No hay sesión activa, redirigir al login
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        // En caso de error, redirigir al login por seguridad
        window.location.href = '/login';
    }
}

// Verificar sesión al cargar la página
verificarSesion();
