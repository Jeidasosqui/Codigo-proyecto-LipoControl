// ====== ONLOAD GENERAL ======
window.onload = function () {
    mostrarUsuario();
    mostrarHistorial();
    crearGrafica();
  
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("tipo");
  
    const texto = document.getElementById("tipoTexto");
    if (texto && tipo) {
      texto.textContent = "Registrando como: " + tipo;
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

  // INSERTAR EN SUPABASE
  const { data, error } = await supabaseClient
    .from("usuarios")
    .insert([
      {
        nombre,
        correo,
        password,
        tipo
      }
    ]);

  if (error) {
    console.error(error);

    if (error.message.includes("duplicado")) {
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
    .value
    .trim()
    .toLowerCase();

  const password = document
    .querySelector("input[type='password']")
    .value
    .trim();

  // BUSCAR USUARIO EN SUPABASE
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("correo", correo)
    .eq("password", password)
    .single();

  if (error || !data) {
    alert("Correo o contraseña incorrectos");
    return;
  }

  // GUARDAR SESIÓN
  localStorage.setItem(
    "usuarioActivo",
    JSON.stringify(data)
  );

  // REDIRECCIÓN
  if (data.tipo === "paciente") {
    window.location.href = "dashboard-paciente.html";
  } else {
    window.location.href = "dashboard-medico.html";
  }
}
  
  // ====== GUARDAR DATOS ======
  async function guardarDatos() {

  const colesterol = document
    .getElementById("colesterol")
    .value;

  const trigliceridos = document
    .getElementById("trigliceridos")
    .value;

  if (!colesterol || !trigliceridos) {
    alert("Completa todos los campos");
    return;
  }

  // USUARIO ACTIVO
  const usuario = JSON.parse(
    localStorage.getItem("usuarioActivo")
  );

  // INSERTAR EN SUPABASE
  const { data, error } = await supabaseClient
    .from("registros")
    .insert([
      {
        usuario: usuario.correo,
        colesterol: Number(colesterol),
        trigliceridos: Number(trigliceridos)
      }
    ]);

  // MANEJO DE ERROR
  if (error) {
    console.error(error);
    alert("Error guardando datos");
    return;
  }

  alert("Datos guardados correctamente");

  // LIMPIAR INPUTS
  document.getElementById("colesterol").value = "";
  document.getElementById("trigliceridos").value = "";

  // RECARGAR HISTORIAL Y GRÁFICA
  mostrarHistorial();
  crearGrafica();
}
  
  // ====== HISTORIAL ======
  function mostrarHistorial() {
    const lista = document.getElementById("historial");
    if (!lista) return;
  
    lista.innerHTML = "";
  
    const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
    const datos = JSON.parse(localStorage.getItem("registros")) || [];
  
    const filtrados = datos.filter(d => d.usuario === usuario.correo);
  
    filtrados.forEach((dato, index) => {
      const li = document.createElement("li");
  
      li.innerHTML = `
        📅 ${dato.fecha} | Colesterol: ${dato.colesterol} | Triglicéridos: ${dato.trigliceridos}
        <button onclick="eliminarDato(${index})">❌</button>
      `;
  
      lista.appendChild(li);
    });
  }
  
  // ====== USUARIO ======
  function mostrarUsuario() {
    const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  
    if (usuario) {
      const texto = document.getElementById("bienvenida");
      if (texto) {
        texto.textContent = "Bienvenido, " + usuario.nombre;
      }
    }
  }
  
  // ====== CERRAR SESIÓN ======
  function cerrarSesion() {
    localStorage.removeItem("usuarioActivo");
    window.location.href = "index.html";
  }
  
  // ====== GRÁFICA ======
  function crearGrafica() {
    const ctx = document.getElementById("miGrafica");
    if (!ctx) return;
  
    const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
    const datos = JSON.parse(localStorage.getItem("registros")) || [];
  
    const filtrados = datos.filter(d => d.usuario === usuario.correo);
  
    if (filtrados.length === 0) return;
  
    const fechas = filtrados.map(d => d.fecha);
    const colesterol = filtrados.map(d => d.colesterol);
    const trigliceridos = filtrados.map(d => d.trigliceridos);
  
    new Chart(ctx, {
      type: "line",
      data: {
        labels: fechas,
        datasets: [
          {
            label: "Colesterol",
            data: colesterol
          },
          {
            label: "Triglicéridos",
            data: trigliceridos
          }
        ]
      }
    });
  }

  // ====== ELIMINAR DATO =====
  function eliminarDato(index) {
    const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
    let datos = JSON.parse(localStorage.getItem("registros")) || [];
  
    // Filtrar solo los del usuario
    const filtrados = datos.filter(d => d.usuario === usuario.correo);
  
    // Obtener el dato real a eliminar
    const datoAEliminar = filtrados[index];
  
    // Eliminarlo del array general
    datos = datos.filter(d => d !== datoAEliminar);
  
    localStorage.setItem("registros", JSON.stringify(datos));
  
    mostrarHistorial();
    crearGrafica();
  }