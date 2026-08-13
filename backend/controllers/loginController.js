const supabase = require("../config/supabase");

async function login(req, res) {

    try {

        // Recibir correo y contraseña enviados desde Postman
        const { correo, password } = req.body;

        // Validar que los datos sean enviados
        if (!correo || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: "Correo y contraseña son obligatorios"
            });
        }

        // Consultar el usuario en Supabase
        const { data, error } = await supabase
            .from("usuarios")
            .select("*")
            .eq("correo", correo)
            .eq("password", password)
            .single();

        // Verificar si hubo error o no se encontró el usuario
        if (error || !data) {
            return res.status(401).json({
                ok: false,
                mensaje: "Correo o contraseña falsos"
            });
        }

        // Login exitoso
        return res.json({
            ok: true,
            mensaje: "Login exitoso",
            usuario: data
        });

    } catch (error) {

        console.error("Error en login:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
}


// Registrar un nuevo usuario
async function registrarUsuario(req, res) {

    try {

        // Recibir datos enviados desde Postman
        const { nombre, correo, password, tipo } = req.body;

        // Validar que todos los datos sean enviados
        if (!nombre || !correo || !password || !tipo) {
            return res.status(400).json({
                ok: false,
                mensaje: "Todos los campos son obligatorios"
            });
        }

        // Insertar el nuevo usuario en Supabase
        const { data, error } = await supabase
            .from("usuarios")
            .insert([
                {
                    nombre: nombre,
                    correo: correo.trim().toLowerCase(),
                    password: password.trim(),
                    tipo: tipo
                }
            ])
            .select();

        // Verificar si ocurrió un error
        if (error) {

            console.error("Error registrando usuario:", error);

            return res.status(500).json({
                ok: false,
                mensaje: "Error registrando usuario"
            });
        }

        // Usuario creado correctamente
        return res.status(201).json({
            ok: true,
            mensaje: "Usuario registrado correctamente",
            usuario: data
        });

    } catch (error) {

        console.error("Error en registro:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
}


// Registrar resultados de laboratorio
async function registrarDatos(req, res) {

    try {

        // Recibir los datos enviados desde Postman
        const { usuario, colesterol, trigliceridos } = req.body;

        // Validar que los datos obligatorios sean enviados
        if (!usuario || !colesterol || !trigliceridos) {
            return res.status(400).json({
                ok: false,
                mensaje: "Usuario, colesterol y trigliceridos son obligatorios"
            });
        }

        // Guardar los datos en Supabase
        const { data, error } = await supabase
            .from("registros")
            .insert([
                {
                    usuario: usuario,
                    colesterol: Number(colesterol),
                    trigliceridos: Number(trigliceridos)
                }
            ])
            .select();

        // Verificar si Supabase produjo un error
        if (error) {

            console.error("Error registrando datos:", error);

            return res.status(500).json({
                ok: false,
                mensaje: "Error guardando los datos"
            });
        }

        // Registro guardado correctamente
        return res.status(201).json({
            ok: true,
            mensaje: "Datos registrados correctamente",
            registro: data
        });

    } catch (error) {

        console.error("Error en registro de datos:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor"
        });
    }
}


// Exportar las funciones
module.exports = {
    login,
    registrarUsuario,
    registrarDatos
};