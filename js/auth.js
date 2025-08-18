// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminMenuItem = document.getElementById('adminMenuItem');

// Función para verificar si el usuario es administrador
function isAdmin(user) {
    // En un entorno real, deberías verificar esto en Firestore o con custom claims
    // Para este ejemplo, consideraremos administrador a un correo específico
    const adminEmails = ['admin@247seguridad.com'];
    return adminEmails.includes(user.email);
}

// Escuchar cambios en el estado de autenticación
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuario autenticado
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        
        // Verificar si es administrador
        if (isAdmin(user)) {
            adminMenuItem.style.display = 'block';
        } else {
            adminMenuItem.style.display = 'none';
        }
    } else {
        // Usuario no autenticado
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        adminMenuItem.style.display = 'none';
    }
});

// Iniciar sesión
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Iniciando sesión',
            text: 'Por favor espere...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Cerrar el modal de login
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                loginModal.hide();
                
                // Limpiar el formulario
                loginForm.reset();
                
                // Mostrar mensaje de éxito
                Swal.fire({
                    title: '¡Bienvenido!',
                    text: 'Has iniciado sesión correctamente',
                    icon: 'success',
                    confirmButtonColor: '#0c75d6',
                    confirmButtonText: 'Continuar'
                }).then(() => {
                    // Verificar si es administrador y redirigir a admin.html
                    if (isAdmin(userCredential.user)) {
                        window.location.href = 'admin.html';
                    } else {
                        // Refrescar la página para usuarios normales
                        window.location.reload();
                    }
                });
            })
            .catch(error => {
                Swal.fire({
                    title: 'Error',
                    text: `Error al iniciar sesión: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#0c75d6',
                    confirmButtonText: 'Intentar de nuevo'
                });
            });
    });
}

// Cerrar sesión
logoutBtn.addEventListener('click', e => {
    e.preventDefault();
    
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro que deseas cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0c75d6',
        cancelButtonColor: '#d4af37',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            auth.signOut()
                .then(() => {
                    Swal.fire({
                        title: 'Sesión cerrada',
                        text: 'Has cerrado sesión correctamente',
                        icon: 'success',
                        confirmButtonColor: '#0c75d6',
                        confirmButtonText: 'Continuar'
                    }).then(() => {
                        // Redirigir a la página de inicio si estamos en el panel de administrador
                        if (window.location.href.includes('admin.html')) {
                            window.location.href = 'index.html';
                        } else {
                            // Refrescar la página
                            window.location.reload();
                        }
                    });
                })
                .catch(error => {
                    Swal.fire({
                        title: 'Error',
                        text: `Error al cerrar sesión: ${error.message}`,
                        icon: 'error',
                        confirmButtonColor: '#0c75d6',
                        confirmButtonText: 'Intentar de nuevo'
                    });
                });
        }
    });
});