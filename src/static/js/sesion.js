async function verificarSesion() {
    try {
        const response = await fetch('/auth/verificar_sesion', {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.logged_in) {
            
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        
        window.location.href = '/login';
    }
}

verificarSesion();
