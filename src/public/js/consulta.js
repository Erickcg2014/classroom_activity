document.addEventListener('DOMContentLoaded', () => {
    const aceptarBtn = document.getElementById('aceptarBtn');
    const nombreInput = document.getElementById('nombre');

    aceptarBtn.addEventListener('click', async () => {
        const nombre = nombreInput.value.trim().toLowerCase();

        if (nombre === '') {
            alert('Por favor, ingrese su nombre.');
            return;
        }

        try {
            const response = await fetch(`/buscarRelacion?nombre=${encodeURIComponent(nombre)}`);
            const data = await response.json();

            if (response.ok) {
                const codigo = data.codigo;
                window.location.href = `relaciones.html?codigo=${codigo}&nombre=${encodeURIComponent(nombre)}`;
            } else {
                alert(data.error || 'No se encontró una relación para este nombre.');
            }
        } catch (error) {
            console.error('Error al buscar la relación:', error);
            alert('Error al buscar la relación. Intente nuevamente.');
        }
    });
});
