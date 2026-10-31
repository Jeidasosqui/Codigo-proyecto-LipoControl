// ============================================
// api-services.js
// Capa de servicios (API) del sistema LipoControl
// Cada función encapsula una operación sobre Supabase
// y actúa como el "servicio" documentado en la EV03.
// ============================================

async function apiLogin(correo, password) {
  const body = {
    correo: correo.trim().toLowerCase(),
    password: password.trim()
  };

  const response = await fetch("http://localhost:3001/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const resultado = await response.json();

  if (resultado.ok) {
    return { data: resultado.usuario, error: null };
  } else {
    return { data: null, error: resultado.mensaje };
  }
}

async function apiRegistrarUsuario({ nombre, correo, password, tipo }) {
  if (!tipo) {
    return { data: null, error: "Tipo de usuario no definido" };
  }

  const body = {
    nombre: nombre,
    correo: correo.trim().toLowerCase(),
    password: password.trim(),
    tipo: tipo
  };

  const response = await fetch("http://localhost:3001/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const resultado = await response.json();

  if (resultado.ok) {
    return { data: resultado.usuario, error: null };
  } else {
    return { data: null, error: resultado.mensaje };
  }
}

async function apiGuardarDatos(correoUsuario, colesterol, trigliceridos) {
  if (!colesterol || !trigliceridos) {
    return { data: null, error: "Completa todos los campos" };
  }

  const { data, error } = await supabaseClient
    .from("registros")
    .insert([{
      usuario: correoUsuario,
      colesterol: Number(colesterol),
      trigliceridos: Number(trigliceridos)
    }]);

  if (error) {
    return { data: null, error: "Error guardando datos" };
  }
  return { data, error: null };
}

async function apiObtenerHistorial(correoUsuario) {
  const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("usuario", correoUsuario);

  if (error) {
    return { data: null, error: "Error consultando historial" };
  }
  return { data, error: null };
}

async function apiEliminarDato(id) {
  const { error } = await supabaseClient
    .from("registros")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: "Error al eliminar este registro" };
  }
  return { success: true, error: null };
}

async function apiListarPacientes() {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("tipo", "paciente");

  if (error) {
    return { data: null, error: "Error listando pacientes" };
  }
  return { data, error: null };
}

async function apiHistorialPaciente(correoPaciente) {
  const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("usuario", correoPaciente);

  if (error) {
    return { data: null, error: "Error consultando historial del paciente" };
  }
  return { data, error: null };
}


/* ============================================
   SERVICIOS DE CITAS
   ============================================ */

// Enviar una solicitud para agendar una cita
async function apiAgendarCita(cita) {
    try {
        const response = await fetch("http://localhost:3001/citas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cita)
        });

        const resultado = await response.json();

        if (!response.ok || !resultado.ok) {
            return {
                data: null,
                error: resultado.mensaje || "No se pudo agendar la cita"
            };
        }

        return {
            data: resultado.cita,
            error: null
        };

    } catch (error) {
        console.error("Error al comunicarse con la API:", error);

        return {
            data: null,
            error: "No fue posible conectar con el servidor"
        };
    }
}


// Consultar las citas registradas
async function apiObtenerCitas() {
    try {
        const response = await fetch("http://localhost:3001/citas");

        const resultado = await response.json();

        if (!response.ok || !resultado.ok) {
            return {
                data: null,
                error: resultado.mensaje || "No se pudieron consultar las citas"
            };
        }

        return {
            data: resultado.citas,
            error: null
        };

    } catch (error) {
        console.error("Error al consultar las citas:", error);

        return {
            data: null,
            error: "No fue posible conectar con el servidor"
        };
    }
}
