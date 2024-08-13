const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;
// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: '#Mancity2004',  
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Cambia a true si usas HTTPS
}));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/index.html');
});

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Emitir todos los mensajes existentes al cliente recién conectado
    socket.on('nuevoEstudiante', (data) => {
        // Manejar el evento 'nuevoEstudiante'
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});


// Ruta para registrar un estudiante
app.post('/register', async (req, res) => {
    const { nombre, genero } = req.body;

    try {
        console.log(`Registrando estudiante: ${nombre}, Género: ${genero}`);

        const checkUser = await pool.query('SELECT * FROM estudiantes WHERE nombre = $1', [nombre]);

        if (checkUser.rows.length > 0) {
            console.log('El nombre de usuario ya existe.');
            return res.status(400).send('El nombre de usuario ya existe. Por favor, elige otro nombre.');
        }

        const carpetaGenero = genero === 'hombre' ? 'Hombre' : 'Mujer';
        console.log(`Buscando imágenes en: public/images/${carpetaGenero}`);
        const imagenes = fs.readdirSync(path.join(__dirname, `public/images/${carpetaGenero}`));
        const imagenAleatoria = imagenes[Math.floor(Math.random() * imagenes.length)];
        const imagenUrl = `/images/${carpetaGenero}/${imagenAleatoria}`;

        console.log(`Insertando en la base de datos: Nombre: ${nombre}, Género: ${genero}, Imagen: ${imagenUrl}`);
        await pool.query('INSERT INTO estudiantes (nombre, genero, imagen) VALUES ($1, $2, $3)', [nombre, genero, imagenUrl]);

        // Guardar el nombre en la sesión
        req.session.nombre = nombre;

        io.emit('nuevoEstudiante', { nombre, imagen: imagenUrl });

        res.json({ mensaje: 'Estudiante registrado con éxito', imagen: imagenUrl });
    } catch (error) {
        console.error('Error al registrar el estudiante:', error);
        res.status(500).send('Error al registrar el estudiante');
    }
});



// Ruta para obtener la lista de estudiantes
app.get('/estudiantes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM estudiantes');

        // No es necesario generar una nueva imagen, simplemente devolver la URL almacenada
        const estudiantesConImagen = result.rows.map(estudiante => {
            return {
                ...estudiante,
                imagen: estudiante.imagen  // La imagen ya está almacenada en la base de datos
            };
        });

        console.log('Estudiantes cargados con imagen:', estudiantesConImagen);
        res.json(estudiantesConImagen);  // Enviar los estudiantes con la imagen incluida
    } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        res.status(500).json({ error: 'Error al obtener estudiantes' });
    }
});

app.get('/estado', async (req, res) => {
    try {
        const result = await pool.query('SELECT estado FROM actividad WHERE id = 1');
        res.json(result.rows[0].estado);
    } catch (error) {
        res.status(500).send('Error al obtener el estado de la actividad');
    }
});

// Ruta para actualizar el estado de la actividad
app.post('/actualizarEstado', async (req, res) => {
    const { nuevoEstado } = req.body;
    try {
        await pool.query('UPDATE actividad SET estado = $1 WHERE id = 1', [nuevoEstado]);
        res.send('Estado actualizado con éxito');
    } catch (error) {
        res.status(500).send('Error al actualizar el estado');
    }
});

//Código para generar código único
const generarCodigoUnico = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase(); // Genera un código alfanumérico único
};

app.post('/asignarNombresAleatorios', async (req, res) => {
    try {
        const estudiantes = await pool.query('SELECT id, nombre FROM estudiantes');
        const listaEstudiantes = estudiantes.rows;

        if (listaEstudiantes.length < 2) {
            return res.status(400).send('No hay suficientes estudiantes para asignar nombres.');
        }

        // Barajar la lista de estudiantes
        const nombresAsignados = [...listaEstudiantes];
        for (let i = nombresAsignados.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nombresAsignados[i], nombresAsignados[j]] = [nombresAsignados[j], nombresAsignados[i]];
        }

        // Asignar nombres, asegurando que nadie se asigne a sí mismo
        const asignaciones = [];
        for (let i = 0; i < listaEstudiantes.length; i++) {
            const estudiante = listaEstudiantes[i];
            const nombreAsignado = nombresAsignados[(i + 1) % listaEstudiantes.length]; // Cicla al siguiente nombre

            // Verifica que no se asigna a sí mismo
            if (estudiante.id === nombreAsignado.id) {
                return res.status(500).send('Error en la asignación: un estudiante fue asignado a sí mismo. Intente de nuevo.');
            }

            asignaciones.push({ estudianteId: estudiante.id, nombreAsignado: nombreAsignado.nombre });
        }

        // Aquí podrías guardar las asignaciones en la base de datos si lo deseas
        // await pool.query('INSERT INTO asignaciones (estudiante_id, nombre_asignado) VALUES ...', [ ... ]);

        res.json(asignaciones); // O devolver las asignaciones directamente al cliente
    } catch (error) {
        console.error('Error al asignar nombres aleatorios:', error);
        res.status(500).send('Error al asignar nombres aleatorios');
    }
});

app.post('/asignarParejas', async (req, res) => {
    try {
        console.log('Iniciando la asignación de parejas...');

        const estudiantes = await pool.query('SELECT id, nombre FROM estudiantes');
        console.log('Estudiantes obtenidos:', estudiantes.rows);

        if (estudiantes.rows.length < 2) {
            return res.status(400).send('No hay suficientes estudiantes para asignar nombres.');
        }

        // Mezclar la lista de estudiantes aleatoriamente
        const estudiantesMezclados = estudiantes.rows.sort(() => Math.random() - 0.5);
        console.log('Estudiantes mezclados:', estudiantesMezclados);

        const asignaciones = [];

        // Asignar parejas de dos en dos
        for (let i = 0; i < estudiantesMezclados.length; i += 2) {
            if (i + 1 < estudiantesMezclados.length) {
                const codigoUnico = generarCodigoUnico();
                const estudiante1 = estudiantesMezclados[i];
                const estudiante2 = estudiantesMezclados[i + 1];

                // Prevenir que un estudiante se asigne a sí mismo
                if (estudiante1.id === estudiante2.id) {
                    return res.status(500).send('Error en la asignación: un estudiante fue asignado a sí mismo. Intente de nuevo.');
                }

                // Insertar la relación de la pareja en la base de datos
                await pool.query(
                    'INSERT INTO relaciones (estudiante1_id, estudiante2_id, codigo) VALUES ($1, $2, $3)',
                    [estudiante1.id, estudiante2.id, codigoUnico]
                );

                asignaciones.push({
                    estudiante1: estudiante1.nombre,
                    estudiante2: estudiante2.nombre,
                    codigo: codigoUnico
                });

                console.log(`Asignando código ${codigoUnico} a los estudiantes: ${estudiante1.nombre} y ${estudiante2.nombre}`);

                // Emitir eventos para redirigir automáticamente a los estudiantes a sus enlaces únicos
                io.emit('redirigirAEnlace', `/html/consulta.html`);
            } else {
                // Si es impar, el último estudiante no tiene pareja
                console.log(`Estudiante sin pareja: ${estudiantesMezclados[i].nombre}`);
            }
        }

        res.json({ mensaje: 'Parejas asignadas con éxito', asignaciones });
    } catch (error) {
        console.error('Error al asignar parejas:', error);
        res.status(500).send('Error al asignar parejas');
    }
});

app.get('/buscarRelacion', async (req, res) => {
    const nombreDelEstudiante = req.query.nombre.trim().toLowerCase();
    console.log('Nombre recibido para buscar relación:', nombreDelEstudiante);

    try {
        // Asegúrate de que la consulta esté correctamente preparada con el parámetro
        const result = await pool.query(
            `SELECT 
                r.codigo, 
                e1.nombre AS estudiante1_nombre, 
                e2.nombre AS estudiante2_nombre 
            FROM relaciones r
            JOIN estudiantes e1 ON r.estudiante1_id = e1.id
            JOIN estudiantes e2 ON r.estudiante2_id = e2.id
            WHERE LOWER(TRIM(e1.nombre)) = $1 OR LOWER(TRIM(e2.nombre)) = $1`, // Uso de $1 para el parámetro
            [nombreDelEstudiante] // Aquí se pasa el parámetro
        );

        if (result.rows.length > 0) {
            const { codigo, estudiante1_nombre, estudiante2_nombre } = result.rows[0];
            const estudiante1NombreNormalizado = estudiante1_nombre.trim().toLowerCase();
            const estudiante2NombreNormalizado = estudiante2_nombre.trim().toLowerCase();

            let nombreCompañero;
            if (nombreDelEstudiante === estudiante1NombreNormalizado) {
                nombreCompañero = estudiante2_nombre;
            } else if (nombreDelEstudiante === estudiante2NombreNormalizado) {
                nombreCompañero = estudiante1_nombre;
            }

            res.json({ codigo, nombreCompañero });
        } else {
            res.status(404).json({ error: 'No se encontró una relación para este nombre.' });
        }
    } catch (error) {
        console.error('Error al buscar la relación:', error);
        res.status(500).json({ error: 'Error al buscar la relación' });
    }
});




app.get('/relacion/codigo/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const nombreDelEstudiante = req.query.nombre.trim().toLowerCase();
    console.log('Código recibido en la petición:', codigo);
    console.log('Nombre del estudiante recibido:', nombreDelEstudiante);

    try {
        console.log('Ejecutando consulta SQL para obtener la relación...');

        const result = await pool.query(
            `SELECT 
                e1.nombre AS estudiante1_nombre,
                e2.nombre AS estudiante2_nombre
            FROM relaciones r
            JOIN estudiantes e1 ON r.estudiante1_id = e1.id
            JOIN estudiantes e2 ON r.estudiante2_id = e2.id
            WHERE r.codigo = $1`,
            [codigo]
        );

        console.log('Resultado de la consulta:', result.rows);

        if (result.rows.length > 0) {
            const { estudiante1_nombre, estudiante2_nombre } = result.rows[0];

            const estudiante1NombreNormalizado = estudiante1_nombre.trim().toLowerCase();
            const estudiante2NombreNormalizado = estudiante2_nombre.trim().toLowerCase();

            console.log('Comparando nombres normalizados:');
            console.log(`Nombre del estudiante proporcionado: '${nombreDelEstudiante}'`);
            console.log(`Estudiante 1: '${estudiante1NombreNormalizado}'`);
            console.log(`Estudiante 2: '${estudiante2NombreNormalizado}'`);

            // Verificar si el estudiante pertenece a la relación
            if (nombreDelEstudiante === estudiante1NombreNormalizado || nombreDelEstudiante === estudiante2NombreNormalizado) {
                const nombreCompañero = nombreDelEstudiante === estudiante1NombreNormalizado ? estudiante2_nombre : estudiante1_nombre;
                console.log('Relación encontrada:', nombreCompañero);
                res.json({ nombreCompañero });
            } else {
                console.error('El nombre proporcionado no coincide con ninguno en la relación');
                res.status(404).json({ error: 'El nombre no coincide con ninguno en la relación' });
            }
        } else {
            console.log(`No se encontró una relación para el código: ${codigo}`);
            res.status(404).json({ error: 'No se encontró la relación para este código' });
        }
    } catch (error) {
        console.error('Error al obtener la relación:', error);
        res.status(500).json({ error: 'Error al obtener la relación' });
    }
});


app.post('/enviarMensaje', async (req, res) => {
    const { codigo, mensaje } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO mensajes (codigo, mensaje, remitente_id)
            VALUES ($1, $2, (SELECT id FROM estudiantes WHERE nombre = $3))
            RETURNING id;
        `, [codigo, mensaje, req.session.nombre]);

        // Emitir el mensaje a todos los clientes conectados
        const estudiante = await pool.query('SELECT nombre FROM estudiantes WHERE id = (SELECT remitente_id FROM mensajes WHERE id = $1)', [result.rows[0].id]);

        io.emit('nuevoMensaje', {
            nombreCompañero: estudiante.rows[0].nombre,
            mensaje: mensaje
        });

        res.status(200).json({ id: result.rows[0].id });
    } catch (error) {
        console.error('Error al guardar el mensaje:', error);
        res.status(500).send('Error al guardar el mensaje');
    }
});

app.get('/obtenerMensajes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.mensaje AS texto, 
                   e2.nombre AS destinatario
            FROM mensajes m
            JOIN relaciones r ON m.codigo = r.codigo
            JOIN estudiantes e1 ON m.remitente_id = e1.id
            JOIN estudiantes e2 ON 
                (r.estudiante1_id = e1.id AND r.estudiante2_id = e2.id) OR 
                (r.estudiante2_id = e1.id AND r.estudiante1_id = e2.id)
            ORDER BY m.id ASC;  -- Asegura que los mensajes se ordenen cronológicamente
        `);

        console.log('Mensajes consultados:', result.rows);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener los mensajes:', error);
        res.status(500).send('Error al obtener los mensajes');
    }
});


server.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});