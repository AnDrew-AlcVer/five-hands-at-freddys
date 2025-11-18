// Estado del formulario
let isLoginMode = true;

// Poner fondo
document.body.style.backgroundImage = "url('/static/img/FNAF_MENU.png')";
document.body.style.backgroundSize = 'cover';
document.body.style.backgroundPosition = 'center';
document.body.style.height = '100vh';
document.body.style.margin = '0';

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toggleText = document.getElementById('toggleText');
const formTitle = document.getElementById('formTitle');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Alternar entre login y registro usando delegación de eventos
toggleText.addEventListener('click', (e) => {
    if (e.target.id === 'toggleLink') {
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            formTitle.textContent = 'Inicia sesión para jugar';
            toggleText.innerHTML = '¿No tienes cuenta? <a id="toggleLink">Regístrate</a>';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            formTitle.textContent = 'Crea tu cuenta';
            toggleText.innerHTML = '¿Ya tienes cuenta? <a id="toggleLink">Inicia sesión</a>';
        }
        
        hideMessages();
    }
});

// Manejar login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('Por favor completa todos los campos');
        return;
    }
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('¡Login exitoso! Redirigiendo...');
            setTimeout(() => {
                window.location.href = '/menu';
            }, 1000);
        } else {
            showError(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        showError('Error de conexión con el servidor');
    }
});

// Manejar registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    
    // Validaciones
    if (!username || !email || !password || !passwordConfirm) {
        showError('Por favor completa todos los campos');
        return;
    }
    
    if (username.length < 3) {
        showError('El usuario debe tener al menos 3 caracteres');
        return;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (password !== passwordConfirm) {
        showError('Las contraseñas no coinciden');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Email inválido');
        return;
    }
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('¡Registro exitoso! Iniciando sesión...');
            setTimeout(() => {
                window.location.href = '/menu';
            }, 1500);
        } else {
            showError(data.message || 'Error al registrarse');
        }
    } catch (error) {
        showError('Error de conexión con el servidor');
    }
});

// Funciones de utilidad
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}
