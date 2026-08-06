const express = require("express");
const loginRoutes = require("./routes/loginRoutes");

const app = express();

const PORT = 3000;

// permite recibir datos en formato json
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();

});

// Registrar rutas
app.use(loginRoutes)

app.post("/prueba", (req, res) => {
    res.json({
        ok: true
    });
});

app.get("/", (req, res) => {
    res.send("API de LipoControl en funcionamiento");
});

// Endpoint de prueba
app.get("/saludo", (req, res) => {
    res.json ({
        mensaje: "Bienvenido a la Api de Lipocontrol",
        estado: "Funcionando perfectamente"
    });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

app.post("/paciente", (req, res) => {

    const datos = req.body;

    res.json({
        mensaje: "Paciente registrado correctamente",
        datos: datos
    });

});