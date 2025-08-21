// Elementos del DOM
const conjuntosContainer = document.getElementById('conjuntosContainer');
const noConjuntosMessage = document.getElementById('noConjuntosMessage');
const residenteForm = document.getElementById('residenteForm');
const vehiculosContainer = document.getElementById('vehiculosContainer');
const agregarVehiculoBtn = document.getElementById('agregarVehiculo');

// Variables globales
let currentUser = null;
let isUserAdmin = false;

// Verificar estado de autenticación
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        isUserAdmin = isAdmin(user);
    }
    // Cargar conjuntos después de verificar autenticación
    cargarConjuntos();
});

// Cargar conjuntos desde Firestore
function cargarConjuntos() {
    db.collection('conjuntos').get()
        .then(snapshot => {
            if (snapshot.empty) {
                noConjuntosMessage.style.display = 'block';
                return;
            }
            
            noConjuntosMessage.style.display = 'none';
            conjuntosContainer.innerHTML = ''; // Limpiamos el contenedor antes de agregar nuevas tarjetas
            
            // Creamos un objeto para rastrear IDs únicos y evitar duplicados
            const conjuntosUnicos = {};
            
            snapshot.forEach(doc => {
                const conjunto = doc.data();
                conjunto.id = doc.id;
                
                // Solo crear la tarjeta si este ID no ha sido procesado antes
                if (!conjuntosUnicos[conjunto.id]) {
                    conjuntosUnicos[conjunto.id] = true;
                    crearCardConjunto(conjunto);
                }
            });
        })
        .catch(error => {
            console.error('Error al cargar conjuntos:', error);
            alert('Error al cargar los conjuntos. Por favor, intente nuevamente.');
        });
}

// Crear card para un conjunto
function crearCardConjunto(conjunto) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4'; // Mantenemos col-md-4 para 3 tarjetas por fila
    
    col.innerHTML = `
        <div class="card h-100 modern-card">
            <div class="card-header">
                <h5 class="card-title mb-0 text-center">${conjunto.nombre}</h5>

            </div>
            <div class="card-body">
                <p class="card-text"><strong>Dirección:</strong> ${conjunto.direccion}</p>
                <p class="card-text">${conjunto.descripcion || 'Sin descripción'}</p>
            </div>
            <div class="card-footer text-center">
                <button class="btn btn-primary entrar-btn" data-id="${conjunto.id}" data-nombre="${conjunto.nombre}">
                    <i class="fas fa-door-open"></i> Entrar
                </button>
            </div>
        </div>
    `;
    
    conjuntosContainer.appendChild(col);
    
    // Agregar evento al botón de entrar
    const entrarBtn = col.querySelector('.entrar-btn');
    entrarBtn.addEventListener('click', () => {
        const conjuntoId = entrarBtn.getAttribute('data-id');
        const conjuntoNombre = entrarBtn.getAttribute('data-nombre');
        
        if (isUserAdmin) {
            // Si es administrador, mostrar tabla de residentes
            mostrarTablaResidentes(conjuntoId, conjuntoNombre);
        } else {
            // Si es usuario normal, mostrar formulario
            mostrarFormularioResidente(conjuntoId);
        }
    });
}

// Mostrar formulario de registro de residente
function mostrarFormularioResidente(conjuntoId) {
    // Limpiar formulario
    residenteForm.reset();
    vehiculosContainer.innerHTML = '';
    
    // Establecer ID del conjunto
    document.getElementById('conjuntoId').value = conjuntoId;
    
    // Mostrar modal
    const formularioModal = new bootstrap.Modal(document.getElementById('formularioModal'));
    formularioModal.show();
}

// Mostrar tabla de residentes (para administradores)
function mostrarTablaResidentes(conjuntoId, conjuntoNombre) {
    const residentesTableBody = document.getElementById('residentesTableBody');
    const residentesModalTitle = document.getElementById('residentesModalTitle');
    
    // Actualizar título del modal
    residentesModalTitle.textContent = `Residentes de ${conjuntoNombre}`;
    
    // Limpiar tabla
    residentesTableBody.innerHTML = '';
    
    // Cargar residentes desde Firestore
    db.collection('conjuntos').doc(conjuntoId).collection('residentes').get()
        .then(snapshot => {
            if (snapshot.empty) {
                residentesTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">No hay residentes registrados en este conjunto.</td>
                    </tr>
                `;
                return;
            }
            
            snapshot.forEach(doc => {
                const residente = doc.data();
                const vehiculosHTML = residente.vehiculos && residente.vehiculos.length > 0 ?
                    residente.vehiculos.map(v => `
                        <div class="mb-2">
                            <strong>Marca:</strong> ${v.marca}<br>
                            <strong>Modelo:</strong> ${v.modelo}<br>
                            <strong>Color:</strong> ${v.color}<br>
                            <strong>Placa:</strong> ${v.placa}
                        </div>
                    `).join('') :
                    'No tiene vehículos registrados';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${residente.nombres}</td>
                    <td>${residente.apellidos}</td>
                    <td>${residente.departamento}</td>
                    <td>${residente.tipoResidente}</td>
                    <td>${residente.contacto}</td>
                    <td>${vehiculosHTML}</td>
                `;
                
                residentesTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error al cargar residentes:', error);
            alert('Error al cargar los residentes. Por favor, intente nuevamente.');
        });
    
    // Mostrar modal
    const residentesModal = new bootstrap.Modal(document.getElementById('residentesModal'));
    residentesModal.show();
}

// Agregar vehículo al formulario
agregarVehiculoBtn.addEventListener('click', function(e) {
    // Prevenir comportamiento por defecto para evitar doble activación
    e.preventDefault();
    
    const vehiculoId = Date.now(); // ID único para el vehículo
    
    // Contar cuántos vehículos hay actualmente para asignar el número
    const vehiculosActuales = document.querySelectorAll('.vehiculo-container').length;
    const numeroVehiculo = vehiculosActuales + 1;
    
    const vehiculoHTML = `
        <div class="vehiculo-container" id="vehiculo-${vehiculoId}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0">Vehículo ${numeroVehiculo}</h5>
                <button type="button" class="btn btn-danger btn-sm remove-vehiculo" data-id="${vehiculoId}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
            <div class="row mb-2">
                <div class="col-md-6">
                    <label class="form-label">Marca</label>
                    <input type="text" class="form-control" name="marca-${vehiculoId}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Modelo</label>
                    <input type="text" class="form-control" name="modelo-${vehiculoId}" required>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">Color</label>
                    <input type="text" class="form-control" name="color-${vehiculoId}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Placa</label>
                    <input type="text" class="form-control" name="placa-${vehiculoId}" required>
                </div>
            </div>
            <hr class="my-3">
        </div>
    `;
    
    vehiculosContainer.insertAdjacentHTML('beforeend', vehiculoHTML);
    
    // Agregar evento para eliminar vehículo con respuesta táctil mejorada
    const removeBtn = document.querySelector(`.remove-vehiculo[data-id="${vehiculoId}"]`);
    if (removeBtn) {
        // Usar evento click para compatibilidad con todos los dispositivos
        removeBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            e.stopPropagation(); // Detener propagación del evento
            
            document.getElementById(`vehiculo-${vehiculoId}`).remove();
            // Renumerar los vehículos después de eliminar uno
            renumerarVehiculos();
        });
    }
}, { passive: false }); // Usar passive: false para mejor control del evento
// This closing bracket appears to be orphaned and should be removed

// Función para renumerar los vehículos
function renumerarVehiculos() {
    const vehiculos = document.querySelectorAll('.vehiculo-container');
    vehiculos.forEach((vehiculo, index) => {
        const titulo = vehiculo.querySelector('h5');
        if (titulo) {
            titulo.textContent = `Vehículo ${index + 1}`;
        }
    });
}

// Enviar formulario de residente
residenteForm.addEventListener('submit', e => {
    e.preventDefault();
    
    // Obtener datos del formulario
    const conjuntoId = document.getElementById('conjuntoId').value;
    const nombres = document.getElementById('nombres').value;
    const apellidos = document.getElementById('apellidos').value;
    const departamento = document.getElementById('departamento').value;
    const tipoResidente = document.getElementById('tipoResidente').value;
    const contacto = document.getElementById('contacto').value;
    
    // Obtener vehículos
    const vehiculos = [];
    const vehiculoContainers = document.querySelectorAll('.vehiculo-container');
    
    vehiculoContainers.forEach(container => {
        const id = container.id.split('-')[1];
        const marca = document.querySelector(`[name="marca-${id}"]`).value;
        const modelo = document.querySelector(`[name="modelo-${id}"]`).value;
        const color = document.querySelector(`[name="color-${id}"]`).value;
        const placa = document.querySelector(`[name="placa-${id}"]`).value;
        
        vehiculos.push({ marca, modelo, color, placa });
    });
    
    // Crear objeto de residente
    const residente = {
        nombres,
        apellidos,
        departamento,
        tipoResidente,
        contacto,
        vehiculos,
        fechaRegistro: new Date()
    };
    
    // Guardar en Firestore
    db.collection('conjuntos').doc(conjuntoId).collection('residentes').add(residente)
        .then(() => {
            alert('Información guardada correctamente.');
            
            // Cerrar modal
            const formularioModal = bootstrap.Modal.getInstance(document.getElementById('formularioModal'));
            formularioModal.hide();
            
            // Limpiar formulario
            residenteForm.reset();
            vehiculosContainer.innerHTML = '';
        })
        .catch(error => {
            console.error('Error al guardar residente:', error);
            alert('Error al guardar la información. Por favor, intente nuevamente.');
        });
});

// Mejorar respuesta táctil en dispositivos móviles
document.addEventListener('DOMContentLoaded', function() {
    // Detectar si es dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Eliminar delay de 300ms en eventos táctiles
        document.documentElement.style.touchAction = 'manipulation';
        
        // Mejorar respuesta de botones
        const allButtons = document.querySelectorAll('.btn, button');
        allButtons.forEach(button => {
            // Usar touchstart para respuesta inmediata
            button.addEventListener('touchstart', function(e) {
                // Prevenir comportamiento por defecto solo si es necesario
                if (this.type !== 'submit') {
                    e.preventDefault();
                }
                
                // Simular clic inmediato
                this.click();
            }, { passive: false });
        });
    }
});