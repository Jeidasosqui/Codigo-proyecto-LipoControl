const supabase = require("../config/supabase");
const crypto = require("crypto");
const { enviarCorreoReset } = require("../utils/email");

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
// Paso 1 de la recuperación: generar el token y enviarlo por correo
async function olvidePassword(req, res) {

    // Siempre la misma respuesta, exista o no el correo
    const respuesta = {
        ok: true,
        mensaje: "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña."
    };

    try {
        const { correo } = req.body;

        if (!correo) {
            return res.status(400).json({
                ok: false,
                mensaje: "El correo es obligatorio"
            });
        }

        const correoLimpio = correo.trim().toLowerCase();

        // Buscar al usuario por correo
        const { data: usuario } = await supabase
            .from("usuarios")
            .select("correo")
            .eq("correo", correoLimpio)
            .single();

        // Si no existe, respondemos igual para no revelar quién está registrado
        if (!usuario) {
            return res.json(respuesta);
        }

        // La llave (va por correo) y su molde (se guarda)
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expira = new Date(Date.now() + 30 * 60 * 1000).toISOString();

               // Guardar solo el molde y el vencimiento
        const { data: filas, error: errorGuardar } = await supabase
            .from("usuarios")
            .update({
                reset_token_hash: tokenHash,
                reset_token_expira: expira
            })
            .eq("correo", correoLimpio)
            .select("correo");

        if (errorGuardar || !filas || filas.length === 0) {
            console.error("No se pudo guardar el token:", errorGuardar || "0 filas actualizadas");
            return res.json(respuesta);
        }

        // Enviar la llave por correo
        const enlace = `${process.env.FRONTEND_URL}/html/reset-password.html?token=${token}`;
        await enviarCorreoReset(correoLimpio, enlace);

        return res.json(respuesta);

    } catch (error) {
        console.error("Error en olvidePassword:", error);
        return res.json(respuesta);
    }
}
// Paso 2 de la recuperación: validar el token y guardar la contraseña nueva
async function restablecerPassword(req, res) {

    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: "Token y contraseña son obligatorios"
            });
        }

        // Convertir la llave recibida en su molde para buscarla
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const { data: usuario } = await supabase
            .from("usuarios")
            .select("correo, reset_token_expira")
            .eq("reset_token_hash", tokenHash)
            .single();

        // Si no existe o ya venció, el enlace no sirve
        if (!usuario || new Date(usuario.reset_token_expira) < new Date()) {
            return res.status(400).json({
                ok: false,
                mensaje: "El enlace no es válido o ya venció"
            });
        }

        // Guardar la contraseña nueva y borrar el token (un solo uso)
        const { error } = await supabase
            .from("usuarios")
            .update({
                password: password.trim(),
                reset_token_hash: null,
                reset_token_expira: null
            })
            .eq("correo", usuario.correo);

        if (error) {
            console.error("Error guardando la contraseña:", error);
            return res.status(500).json({
                ok: false,
                mensaje: "No se pudo actualizar la contraseña"
            });
        }

        return res.json({
            ok: true,
            mensaje: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        console.error("Error en restablecerPassword:", error);
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
    registrarDatos,
    olvidePassword,
    restablecerPassword
};