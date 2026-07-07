// ====== ONLOAD GENERAL ======
function verificarSesion(){
  const usuario = localStorage.getItem("usuarioActivo");

  if (!usuario) {
    alert("Lo siento!!Debes iniciar sesión");

    window.location.href = "index.html";
  }
}
window.onload = function () {

    mostrarPacientes();

    const paginaActual = window.location.pathname;

    if ( 
      paginaActual.includes("dashboard-paciente.html")||
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
      texto.textContent = "Usted se esta registrando como: " + tipo;
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
  async function mostrarHistorial() {

  const lista = document.getElementById("historial");

  if (!lista) return;

  lista.innerHTML = "";

  const usuario = JSON.parse(
    localStorage.getItem("usuarioActivo")
  );

  const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("usuario", usuario.correo);

  console.log(data);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((dato) => {

    const li = document.createElement("li");

    li.innerHTML = `
      Fecha: ${dato.fecha}
      | Colesterol: ${dato.colesterol}
      | Triglicéridos: ${dato.trigliceridos}

      <button onclick="eliminarDato(${dato.id})">
      ❌
      </button>
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
  async function eliminarDato(id) {
    
    const {error} = await supabaseClient
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

  // Medico dash

  async function mostrarPacientes(){

    const lista = document.getElementById("listaPacientes");

    if (!lista) return;

    lista.innerHTML= "";

    const {data,error} = await supabaseClient
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

    async function mostrarHistorialPaciente(correo) {

    const lista =
      document.getElementById("historialPaciente");

      if(!lista) return;

      lista.innerHTML = "";

      const { data, error} =
        await supabaseClient
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
            Fecha: ${registro.fecha}
            |
            Colesterol: ${registro.colesterol}
            |
            Trigliceridos: ${registro.trigliceridos}
          `;
          lista.appendChild(li);
        });
  }