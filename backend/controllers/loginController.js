const supabase = require("../config/supabase");

async function login(req,res) {
    return res.json({
        mensaje: "Controller si funciona :)"
    });
}

module.exports = {
    login
};