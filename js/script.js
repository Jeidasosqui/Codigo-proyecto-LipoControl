// ====== VERIFICAR SESIÓN ======
function verificarSesion() {
  const usuario = localStorage.getItem("usuarioActivo");
  if (!usuario) {
    alert("Lo siento!! Debes iniciar sesión");
    window.location.href = "index.html";
  }
}

// ====== ONLOAD GENERAL ======
window.onload = function () {

  mostrarPacientes();

  const paginaActual = window.location.pathname;

  if (
    paginaActual.includes("dashboard-paciente.html") ||
    paginaActual.includes("dashboard-medico.html")
  ) {
    verificarSesion();
  }

  mostrarUsuario();
  mostrarHistorial();
  crearGrafica();

  const params = new URLSearchParams(window.location.search);
  const tipo = params.get("tipo");

  const texto = document.getElementById("tipoTexto");
  if (texto && tipo) {
    texto.textContent = "Usted se está registrando como: " + tipo;
  }
};

// ====== REGISTRAR USUARIO ======
async function registrarUsuario(e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  const params = new URLSearchParams(window.location.search);
  const tipo = params.get("tipo");

  if (!tipo) {
    alert("Tipo de usuario no definido");
    return;
  }

  const { data, error } = await supabaseClient
    .from("usuarios")
    .insert([{ nombre, correo, password, tipo }]);
  if (error) {
    console.error(error);
    if (error.code === "23505") { 
      alert("Ese correo ya está registrado");
    } else { 
      alert("Error registrando usuario");
    }
    return;
  }

  alert("Usuario registrado correctamente");
  window.location.href = "index.html";
}

// ====== LOGIN ======
async function login(e) {
  e.preventDefault();

  const correo = document
    .querySelector("input[type='email']")
    .value.trim().toLowerCase();

  const password = document
    .querySelector("input[type='password']")
    .value.trim();

  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("correo", correo)
    .eq("password", password)
    .single();

  console.log("resultado:", data, error);

  if (error || !data) {
    alert("Correo o contraseña incorrectos");
    return;
  }

  // GUARDAR SESIÓN
  localStorage.setItem("usuarioActivo", JSON.stringify(data));

  // REDIRIGIR SEGÚN ROL
  if (data.tipo === "paciente") {
    window.location.href = "dashboard-paciente.html";
  } else {
    window.location.href = "dashboard-medico.html";
  }
}

// ====== GUARDAR DATOS ======
async function guardarDatos() {
  const hdl = document.getElementById("colesterolhdl").value;
  const ldl = document.getElementById("colesterolldl").value;
  const vldl = document.getElementById("colesterolvldl").value;
  const trigliceridos = document.getElementById("trigliceridos").value;
  const tipomedicion = document.getElementById("tipomedicion").value;

  if (!hdl || !ldl || !vldl || !trigliceridos || !tipomedicion) {
    alert("Completa todos los campos");
    return;
  }

  const total = Number (hdl) + Number(ldl) + Number(vldl);


  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));

  const { error } = await supabaseClient
    .from("registros")
    .insert([{
      usuario: usuario.correo,
      colesterol: total,
      colesterol_hdl: Number(hdl),
      colesterol_ldl: Number(ldl),
      colesterol_vldl: Number(vldl),
      tipo_medicion: tipomedicion,
      trigliceridos: Number(trigliceridos),
      fecha: new Date().toISOString().split("T")[0]
    }]);

  if (error) {
    console.error(error);
    alert("Error  al guardando datos");
    return;
  }

  alert("Datos guardados correctamente");

  
  document.getElementById("colesterolhdl").value = "";
  document.getElementById("colesterolldl").value = "";
  document.getElementById("colesterolvldl").value = "";
  document.getElementById("trigliceridos").value = "";
  document.getElementById("colesteroltotal").textContent = "0";
  mostrarHistorial();
  crearGrafica();
}
//CALCULAR COLESTEROL TOTAL//
  function calcularcolesteroltotal() {
  const hdl = parseFloat(document.getElementById("colesterolhdl").value) || 0;
  const ldl = parseFloat(document.getElementById("colesterolldl").value) || 0;
  const vldl = parseFloat(document.getElementById("colesterolvldl").value) || 0;

  const total = hdl + ldl + vldl;

  document.getElementById("colesteroltotal").textContent = total;
  }


//=======EVALUAR NVELES DE COLESTEROL Y TRIGLICÉRIDOS ======


function evaluarHDL(valor) {
  if (valor < 40){
    return "muy bajo, riesgo";
  }
  else if (valor < 60) {
    return "al limite";
  }
  else   {
    return "normal";
  }
}
function evaluarLDL(valor) {
  if (valor >= 160) {
    return "muy alto";
  }
    else  if (valor >= 100) {
      return " al limite";
    }
    else{
      return "normal";
    }
  }

function evaluarVLDL(valor) {
  if (valor < 30){
    return " normal";
  }
  else {
    return "alto";
  }
}
function evaluartrigliceridos(valor) {
  if (valor >= 200){
    return "muy alto";
  }
  else if (valor >= 150) {
    return "al limite";
  }
else {
  return"normal";
}
}

//=======HISTORIAL ======
async function mostrarHistorial() {
  const lista = document.getElementById("historial");
  if (!lista) return;

  lista.innerHTML = "";

  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (!usuario) return;

  const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("usuario", usuario.correo);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((dato) => {
    const li = document.createElement("li");
    li.innerHTML = `
      Fecha: ${dato.fecha || "Sin fecha"}
      | Colesterol: ${dato.colesterol}
      | Triglicéridos: ${dato.trigliceridos}
      <button onclick="eliminarDato(${dato.id})">❌</button>
    `;
    lista.appendChild(li);
  });
}

// ====== MOSTRAR USUARIO ======
function mostrarUsuario() {
  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (usuario) {
    const texto = document.getElementById("bienvenida");
    if (texto) {      texto.textContent = "Bienvenido, " + usuario.nombre;
    }
  }
}

// ====== CERRAR SESIÓN ======
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  window.location.href = "index.html";
}

// ====== GRÁFICA ======
let graficaActual = null;

async function crearGrafica() {
  const ctx = document.getElementById("miGrafica");
  if (!ctx) return;

  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (!usuario) return;

  const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("usuario", usuario.correo);

  if (error || !data || data.length === 0) return;

  // Destruir gráfica anterior para evitar duplicados
  if (graficaActual) {
    graficaActual.destroy();
  }

  const fechas = data.map(d => d.fecha || "Sin fecha");
  const colesterol = data.map(d => d.colesterol);
  const trigliceridos = data.map(d => d.trigliceridos);

  graficaActual = new Chart(ctx, {
    type: "line",
    data: {
      labels: fechas,
      datasets: [
        { label: "Colesterol", data: colesterol, borderColor: "#007BFF", tension: 0.3 },
        { label: "Triglicéridos", data: trigliceridos, borderColor: "#FF5733", tension: 0.3 }
      ]
    }
  });
}

// ====== ELIMINAR DATO ======
async function eliminarDato(id) {
  if (!confirm("¿Estás seguro de eliminar este registro?")) return;

  const { error } = await supabaseClient
    .from("registros")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Error al eliminar este registro");
    return;
  }

  alert("Registro eliminado correctamente!");
  mostrarHistorial();
  crearGrafica();
}

// ====== MOSTRAR PACIENTES (médico) ======
async function mostrarPacientes() {
  const lista = document.getElementById("listaPacientes");
  if (!lista) return;

  lista.innerHTML = "";

  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("tipo", "paciente");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((paciente) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button onclick="mostrarHistorialPaciente('${paciente.correo}')">
        ${paciente.nombre}
      </button>
    `;
    lista.appendChild(li);
  });
}

// ====== HISTORIAL DE PACIENTE (médico) ======
async function mostrarHistorialPaciente(correo) {
  const lista = document.getElementById("historialPaciente");
  if (!lista) return;

  lista.innerHTML = "";

  const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("usuario", correo);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((registro) => {
    const li = document.createElement("li");
    li.innerHTML = `
      Fecha: ${registro.fecha || "Sin fecha"}
      | Colesterol: ${registro.colesterol}
      | Triglicéridos: ${registro.trigliceridos}
    `;
    lista.appendChild(li);
  });
}
