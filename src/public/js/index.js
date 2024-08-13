document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (!registerForm) {
        console.error('El formulario de registro no se encontró en el DOM.');
        return;
    }

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita que el formulario se envíe de la forma tradicional

        const nombre = document.getElementById('nombre').value.trim().toLowerCase();
        
        // Obtener el valor del género seleccionado
        const generoElement = document.querySelector('input[name="genero"]:checked');
        const genero = generoElement ? generoElement.value : null;

        if (!nombre) {
            alert('Por favor, ingresa tu nombre.');
            return;
        }

        if (!genero) {
            alert('Por favor, selecciona tu género.');
            return;
        }

        // Almacenar el nombre en localStorage
        localStorage.setItem('nombreRegistrado', nombre);

        try {
            // Enviar los datos al servidor para registrar el estudiante
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre, genero })
            });

            if (response.ok) {
                // Redirigir a la página de registrados
                window.location.href = 'html/registrados.html';
            } else {
                const errorText = await response.text();
                alert(`Error al registrar: ${errorText}`);
            }
        } catch (error) {
            console.error('Error al registrar el estudiante:', error);
            alert('Error al registrar el estudiante. Intente nuevamente.');
        }
    });
});
