document.addEventListener('DOMContentLoaded', async () => {
    const muroMensajes = document.getElementById('muroMensajes');
    const socket = io();  // Inicializar Socket.IO

    // Cargar mensajes al inicio
    async function cargarMensajes() {
        try {
            const response = await fetch('/obtenerMensajes');
            if (!response.ok) {
                throw new Error(`Error en la respuesta: ${response.statusText}`);
            }
            const mensajes = await response.json();

            // Log de los mensajes recibidos
            console.log('Mensajes recibidos:', mensajes);

            muroMensajes.innerHTML = ''; // Limpiar los mensajes existentes

            mensajes.forEach(mensaje => {
                console.log('Agregando mensaje:', mensaje);
                agregarMensaje(mensaje);
            });
        } catch (error) {
            console.error('Error al cargar los mensajes:', error);
            muroMensajes.innerHTML = '<p>Error al cargar los mensajes</p>';
        }
    }

    // Función para agregar un mensaje al muro
    function agregarMensaje(mensaje) {
        const mensajeCard = document.createElement('div');
        mensajeCard.className = 'mensaje-card';
        mensajeCard.innerHTML = `
            <h3>Mensaje para ${mensaje.destinatario}</h3>
            <p>${mensaje.texto}</p>
        `;
        muroMensajes.appendChild(mensajeCard);
    }

    // Escuchar el evento 'nuevoMensaje' desde el servidor
    // Escuchar el evento 'todosLosMensajes' desde el servidor
    socket.on('todosLosMensajes', (mensajes) => {
        console.log('Todos los mensajes recibidos:', mensajes);
        muroMensajes.innerHTML = ''; // Limpiar los mensajes existentes

        mensajes.forEach(mensaje => {
            agregarMensaje(mensaje);
        });
    });

    // Escuchar el evento 'nuevoMensaje' desde el servidor
    socket.on('nuevoMensaje', (mensaje) => {
        console.log('Nuevo mensaje recibido:', mensaje);
        agregarMensaje(mensaje);
    });


    // Cargar los mensajes al inicio
    cargarMensajes();
});
