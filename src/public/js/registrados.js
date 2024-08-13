const socket = io(); // Conectar al servidor de WebSockets
document.addEventListener('DOMContentLoaded', async () => {
    const estudiantesList = document.getElementById('listaEstudiantes');
    const btnSiguientePaso = document.getElementById('btnSiguientePaso');

    // Obtener el nombre del usuario registrado desde localStorage
    const nombreUsuarioActual = localStorage.getItem('nombreRegistrado')?.trim().toLowerCase();

    console.log('Nombre del usuario registrado:', nombreUsuarioActual);

    // Mostrar el botón si el usuario actual es "Erick Camargo"
    if (nombreUsuarioActual === 'erick camargo') {
        btnSiguientePaso.style.display = 'block';
        btnSiguientePaso.addEventListener('click', async () => {
            console.log('Botón de siguiente paso clicado por:', nombreUsuarioActual);
            try {
                const response = await fetch('/asignarParejas', {
                    method: 'POST',
                });

                if (response.ok) {
                    console.log('Parejas asignadas correctamente. Esperando redirección...');
                } else {
                    console.error('Error al asignar parejas:', response.statusText);
                }
            } catch (error) {
                console.error('Error al asignar parejas:', error);
            }
        });
    }
    
    // Cargar lista de estudiantes registrados
    async function cargarEstudiantes() {
        try {
            const response = await fetch('/estudiantes');
            if (!response.ok) {
                throw new Error(`Error en la respuesta: ${response.statusText}`);
            }
            const estudiantes = await response.json();

            console.log('Estudiantes cargados:', estudiantes);

            estudiantesList.innerHTML = ''; // Limpiar la lista de estudiantes

            estudiantes.forEach(estudiante => {
                agregarEstudiante(estudiante);
            });
        } catch (error) {
            console.error('Error al cargar estudiantes:', error);
            estudiantesList.innerHTML = '<li>Error al cargar estudiantes</li>';
        }
    }

    // Función para agregar un estudiante a la lista
    function agregarEstudiante(estudiante) {
        const li = document.createElement('li');
        li.className = 'estudiante-card';  // Asignar la clase de la tarjeta
        li.innerHTML = `
            <img src="${estudiante.imagen}" alt="Imagen de famoso">
            <h3>${estudiante.nombre}</h3>
        `;
        estudiantesList.appendChild(li);
    }

    // Escuchar el evento 'nuevoEstudiante' desde el servidor
    socket.on('nuevoEstudiante', (estudiante) => {
        console.log('Nuevo estudiante registrado:', estudiante);
        agregarEstudiante(estudiante);
    });

    // Escuchar el evento para redirigir a la página de relaciones
    socket.on('redirigirRelaciones', () => {
        console.log('Evento redirigirRelaciones recibido. Redirigiendo a relaciones.html');
        window.location.href = '/html/consulta.html';
    });

    // Escuchar el evento para redirigir a la página específica de cada estudiante
    socket.on('redirigirAEnlace', (enlace) => {
        console.log(`Evento redirigirAEnlace recibido. Redirigiendo a ${enlace}`);
        window.location.href = enlace; // Redirigir automáticamente al enlace único
    });

    // Cargar estudiantes al inicio
    cargarEstudiantes();
});
