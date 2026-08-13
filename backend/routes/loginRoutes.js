console.log("✅ loginRoutes cargado");

const express = require("express");
const router = express.Router();

const { login, registrarUsuario, registrarDatos } = require("../controllers/loginController");

router.post("/login", login);

router.post("/usuarios", registrarUsuario);

router.post("/registros", registrarDatos);

module.exports = router;