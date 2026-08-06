console.log("✅ loginRoutes cargado");

const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
    res.json({
        mensaje: "Ruta login funcionando"
    });
});

module.exports = router;