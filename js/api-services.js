// ============================================
// api-services.js
// Capa de servicios (API) del sistema LipoControl
// Cada función encapsula una operación sobre Supabase
// y actúa como el "servicio" documentado en la EV03.
// ============================================

async function apiLogin(correo, password) {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("correo", correo.trim().toLowerCase())
    .eq("password", password.trim())
    .single();

  if (error || !data) {
    return { data: null, error: "Correo o contraseña incorrectos" };
  }
  return { data, error: null };
}

async function apiRegistrarUsuario({ nombre, correo, password, tipo }) {
  if (!tipo) {
    return { data: null, error: "Tipo de usuario no definido" };
  }

  const { data, error } = await supabaseClient
    .from("usuarios")
    .insert([{ nombre, correo: correo.trim().toLowerCase(), password: password.trim(), tipo }]);

  if (error) {
    const mensaje = error.message.includes("duplicado")
      ? "Ese correo ya está registrado"
      : "Error registrando usuario";
    return { data: null, error: mensaje };
  }
  return { data, error: null };
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