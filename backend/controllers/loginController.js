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

module.exports = {
    login
};