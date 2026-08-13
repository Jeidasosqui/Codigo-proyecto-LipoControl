const express = require("express");
const loginRoutes = require("./routes/loginRoutes");

const app = express();

const PORT = 3000;

// Permite recibir datos en formato JSON
app.use(express.json());

// Middleware para mostrar las peticiones recibidas
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// Registrar las rutas de login, usuarios y registros
app.use(loginRoutes);

// Endpoint de prueba
app.post("/prueba", (req, res) => {
    res.json({
        ok: true
    });
});

// Ruta principal
app.get("/", (req, res) => {
    res.send("API de LipoControl en funcionamiento");
});

// Endpoint de saludo
app.get("/saludo", (req, res) => {
    res.json({
        mensaje: "Bienvenido a la API de LipoControl",
        estado: "Funcionando perfectamente"
    });
});

// Endpoint para registrar paciente de prueba
app.post("/paciente", (req, res) => {

    const datos = req.body;

    res.json({
        mensaje: "Paciente registrado correctamente",
        datos: datos
    });

});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});