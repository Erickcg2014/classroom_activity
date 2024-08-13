document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    // Función para deslizarse a la siguiente página
    function slideToNextPage(url) {
        document.body.style.transition = 'transform 0.5s ease-in-out';
        document.body.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            window.location.href = url;
        }, 500); // Esperar a que la animación termine antes de redirigir
    }

    // Registrar estudiante
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nombre = document.getElementById('nombre').value;
        const genero = document.getElementById('genero').value;

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, genero }),
        });

        if (response.ok) {
            const data = await response.json();

            // Guardar el nombre del estudiante en localStorage
            localStorage.setItem('nombreDelEstudiante', nombre);

            alert('Estudiante registrado con éxito');
            mostrarImagen(data.imagen);  // Mostrar imagen aleatoria según el género
            setTimeout(() => slideToNextPage('html/registrados.html'), 2000); // Esperar 2 segundos para mostrar la imagen y luego deslizarse a la siguiente página
        } else {
            const errorText = await response.text();
            alert(errorText);  // Mostrar el mensaje de error si el nombre ya existe
        }
    });

    // Función para mostrar la imagen aleatoria
    function mostrarImagen(imagenUrl) {
        const imgElement = document.createElement('img');
        imgElement.src = imagenUrl;
        imgElement.alt = 'Imagen aleatoria de famoso';
        imgElement.style.display = 'block';
        imgElement.style.margin = '20px auto';
        imgElement.style.maxWidth = '200px';
        document.body.appendChild(imgElement);  // Añadir la imagen al cuerpo del documento
    }
});
