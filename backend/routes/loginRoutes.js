console.log("✅ loginRoutes cargado");

const express = require("express");
const router = express.Router();

const { login, registrarUsuario, registrarDatos, olvidePassword, restablecerPassword } = require("../controllers/loginController");

router.post("/login", login);

router.post("/usuarios", registrarUsuario);

router.post("/registros", registrarDatos);

router.post("/olvide-password", olvidePassword);

router.post("/restablecer-password", restablecerPassword);

module.exports = router;