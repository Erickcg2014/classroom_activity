document.addEventListener('DOMContentLoaded', async () => {
    const compañeroNombre = document.getElementById('compañeroNombre');
    const enviarMensajeBtn = document.getElementById('enviarMensaje');
    const mensajeInput = document.getElementById('mensaje');

    // Crear un elemento de contador para palabras
    const contador = document.createElement('p');
    contador.id = 'contador';
    mensajeInput.parentNode.insertBefore(contador, mensajeInput.nextSibling);

    // Actualizar el contador de palabras
    function actualizarContador() {
        const palabras = mensajeInput.value.trim().split(/\s+/);
        const palabrasContadas = palabras.length > 1 && palabras[0] === '' ? 0 : palabras.length;
        contador.textContent = `${palabrasContadas}/25 palabras`;
    }

    // Obtener el código y el nombre desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const codigo = urlParams.get('codigo');
    const nombreDelEstudiante = urlParams.get('nombre').trim().toLowerCase();

    if (!codigo || !nombreDelEstudiante) {
        console.error('Código o nombre no están definidos');
        return;
    }

    try {
        console.log('Intentando obtener la relación para el código:', codigo);
        const response = await fetch(`/relacion/codigo/${codigo}?nombre=${encodeURIComponent(nombreDelEstudiante)}`);
        const data = await response.json();
        console.log('Respuesta recibida:', data);

        if (response.ok) {
            console.log('Relación encontrada con éxito:', data);
            compañeroNombre.textContent = `Estás escribiendo a: ${data.nombreCompañero}`;
        } else {
            console.error('No se encontró la relación:', data.error);
            compañeroNombre.textContent = 'No se encontró un compañero asignado.';
        }
    } catch (error) {
        console.error('Error al obtener la relación:', error);
        compañeroNombre.textContent = 'Error al obtener la relación.';
    }

    // Actualizar el contador cuando el usuario escriba en el cuadro de texto
    mensajeInput.addEventListener('input', () => {
        actualizarContador();

        const palabras = mensajeInput.value.trim().split(/\s+/);
        if (palabras.length > 25) {
            mensajeInput.value = palabras.slice(0, 25).join(' ');
            alert('El mensaje no puede contener más de 25 palabras.');
        }
    });

    // Inicializar el contador al cargar la página
    actualizarContador();

    // Manejar el envío del mensaje
    enviarMensajeBtn.addEventListener('click', async () => {
        const mensaje = mensajeInput.value;

        if (mensaje.trim().split(/\s+/).length > 25) {
            alert('El mensaje no puede contener más de 25 palabras.');
            return;
        }

        try {
            const response = await fetch('/enviarMensaje', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ codigo, mensaje }),
            });

            if (response.ok) {
                alert('Mensaje enviado con éxito');
                mensajeInput.value = '';  // Limpiar el textarea después de enviar el mensaje
                actualizarContador();  // Resetear el contador

                // Redirigir a la página tipo Padlet
                window.location.href = '/html/padlet.html';
            } else {
                alert('Error al enviar el mensaje');
            }
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
        }
    });
});
