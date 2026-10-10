const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function enviarCorreoReset(destino, enlace) {
    await transporter.sendMail({
        from: `LipoControl <${process.env.EMAIL_USER}>`,
        to: destino,
        subject: "Restablece tu contraseña",
        html: `
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p><a href="${enlace}">Haz clic aquí para crear una nueva</a></p>
            <p>El enlace vence en 30 minutos. Si no fuiste tú, ignora este correo.</p>
        `
    });
}

module.exports = { enviarCorreoReset };