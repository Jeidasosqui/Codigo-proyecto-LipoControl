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

  const response = await fetch("http://localhost:3000/login", {
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

  const response = await fetch("http://localhost:3000/usuarios", {
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