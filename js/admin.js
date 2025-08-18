// Elementos del DOM
const conjuntosContainer = document.getElementById('conjuntosContainer');
const noConjuntosMessage = document.getElementById('noConjuntosMessage');
const conjuntoForm = document.getElementById('conjuntoForm');

// Verificar si el usuario está autenticado y es administrador
auth.onAuthStateChanged(user => {
    if (user) {
        if (isAdmin(user)) {
            // Cargar conjuntos
            cargarConjuntos();
        } else {
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
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
            conjuntosContainer.innerHTML = '';

            snapshot.forEach(doc => {
                const conjunto = doc.data();
                conjunto.id = doc.id;
                crearCardConjunto(conjunto);
            });
        })
        .catch(error => {
            console.error('Error al cargar conjuntos:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar los conjuntos. Por favor, intente nuevamente.',
                icon: 'error',
                confirmButtonColor: '#0c75d6',
                confirmButtonText: 'Aceptar'
            });
        });
}

// Crear card para un conjunto
function crearCardConjunto(conjunto) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4'; // Mantenemos col-md-4 para 3 tarjetas por fila

    col.innerHTML = `
        <div class="card h-100 modern-card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">${conjunto.nombre}</h5>
                <button class="btn btn-sm btn-danger eliminar-btn" data-id="${conjunto.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="card-body">
                <p class="card-text"><strong>Dirección:</strong> ${conjunto.direccion}</p>
                <p class="card-text">${conjunto.descripcion || 'Sin descripción'}</p>
            </div>
            <div class="card-footer text-center">
                <button class="btn btn-primary entrar-btn" data-id="${conjunto.id}" data-nombre="${conjunto.nombre}">
                    <i class="fas fa-door-open"></i> Ver Residentes
                </button>
            </div>
        </div>
    `;

    conjuntosContainer.appendChild(col);

    // Botón de entrar
    const entrarBtn = col.querySelector('.entrar-btn');
    entrarBtn.addEventListener('click', () => {
        const conjuntoId = entrarBtn.getAttribute('data-id');
        const conjuntoNombre = entrarBtn.getAttribute('data-nombre');
        mostrarTablaResidentes(conjuntoId, conjuntoNombre);
    });

    // Botón de eliminar
    const eliminarBtn = col.querySelector('.eliminar-btn');
    eliminarBtn.addEventListener('click', e => {
        e.stopPropagation();
        const conjuntoId = eliminarBtn.getAttribute('data-id');
        Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0c75d6',
            cancelButtonColor: '#d4af37',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                eliminarConjunto(conjuntoId);
            }
        });
    });
}

// Mostrar tabla de residentes
function mostrarTablaResidentes(conjuntoId, conjuntoNombre) {
    const residentesTableBody = document.getElementById('residentesTableBody');
    const residentesModalTitle = document.getElementById('residentesModalTitle');

    residentesModalTitle.textContent = `Residentes de ${conjuntoNombre}`;
    residentesTableBody.innerHTML = '';

    db.collection('conjuntos').doc(conjuntoId).collection('residentes').get()
        .then(snapshot => {
            if (snapshot.empty) {
                residentesTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">No hay residentes registrados en este conjunto.</td>
                    </tr>
                `;
                return;
            }

            snapshot.forEach(doc => {
                const residente = doc.data();
                residente.id = doc.id;

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
                    <td>
                        <button class="btn btn-sm btn-danger eliminar-residente" data-conjunto="${conjuntoId}" data-residente="${residente.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;

                residentesTableBody.appendChild(row);
            });

            document.querySelectorAll('.eliminar-residente').forEach(btn => {
                btn.addEventListener('click', () => {
                    const conjuntoId = btn.getAttribute('data-conjunto');
                    const residenteId = btn.getAttribute('data-residente');
                    Swal.fire({
                        title: '¿Está seguro?',
                        text: 'Esta acción no se puede deshacer.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#0c75d6',
                        cancelButtonColor: '#d4af37',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            eliminarResidente(conjuntoId, residenteId);
                        }
                    });
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar residentes:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar los residentes. Por favor, intente nuevamente.',
                icon: 'error',
                confirmButtonColor: '#0c75d6',
                confirmButtonText: 'Aceptar'
            });
        });

    const residentesModal = new bootstrap.Modal(document.getElementById('residentesModal'));
    residentesModal.show();
}

// Eliminar conjunto
function eliminarConjunto(conjuntoId) {
    db.collection('conjuntos').doc(conjuntoId).delete()
        .then(() => {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Conjunto eliminado correctamente.',
                icon: 'success',
                confirmButtonColor: '#0c75d6',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                window.location.reload(); // Recargar página
            });
        })
        .catch(error => {
            console.error('Error al eliminar conjunto:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al eliminar el conjunto. Por favor, intente nuevamente.',
                icon: 'error',
                confirmButtonColor: '#0c75d6',
                confirmButtonText: 'Aceptar'
            });
        });
}

// Eliminar residente
function eliminarResidente(conjuntoId, residenteId) {
    db.collection('conjuntos').doc(conjuntoId).collection('residentes').doc(residenteId).delete()
        .then(() => {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Residente eliminado correctamente.',
                icon: 'success',
                confirmButtonColor: '#0c75d6',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                window.location.reload(); // Recargar página
            });
        })
        .catch(error => {
            console.error('Error al eliminar residente:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al eliminar el residente. Por favor, intente nuevamente.',
                icon: 'error',
                confirmButtonColor: '#0c75d6',
                confirmButtonText: 'Aceptar'
            });
        });
}

// Crear nuevo conjunto
conjuntoForm.addEventListener('submit', e => {
    e.preventDefault();

    const nombre = document.getElementById('nombreConjunto').value;
    const direccion = document.getElementById('direccionConjunto').value;
    const descripcion = document.getElementById('descripcionConjunto').value;

    const conjunto = {
        nombre,
        direccion,
        descripcion,
        fechaCreacion: new Date()
    };

    db.collection('conjuntos').add(conjunto)
        .then(() => {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Conjunto creado correctamente.',
                icon: 'success',
                confirmButtonColor: '#0c75d6',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                window.location.reload(); // Recargar página
            });

            const conjuntoModal = bootstrap.Modal.getInstance(document.getElementById('conjuntoModal'));
            conjuntoModal.hide();
            conjuntoForm.reset();
        })
        .catch(error => {
            console.error('Error al crear conjunto:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al crear el conjunto. Por favor, intente nuevamente.',
                icon: 'error',
                confirmButtonColor: '#0c75d6',
                confirmButtonText: 'Aceptar'
            });
        });
});
