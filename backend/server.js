const express = require("express");

const app = express();

const PORT = 3000;

// permite recibir datos en formato json
app.use(express.json());

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