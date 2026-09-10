const express = require("express");
const cors = require("cors");
const loginRoutes = require("./routes/loginRoutes");

const app = express();
const PORT = 3001;

// ← CORS PRIMERO
app.use(cors({
  origin: ["http://localhost:5500", "http://localhost:3001", "http://127.0.0.1:5500"],
  credentials: true
}));

// ← express.json DESPUÉS
app.use(express.json());

// Middleware para mostrar las peticiones recibidas
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// Registrar las rutas
app.use(loginRoutes);

// Endpoints...
app.get("/", (req, res) => {
    res.send("API de LipoControl en funcionamiento");
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});