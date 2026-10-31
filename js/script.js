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

  const { data, error } = await apiRegistrarUsuario({ nombre, correo, password, tipo });

  if (error) {
    alert(error);
    return;
  }

  alert("Usuario registrado correctamente");
  window.location.href = "index.html";
}

// ====== LOGIN ======
async function login(event) {
  event.preventDefault();

  const correo = document.querySelector("input[type='email']").value;
  const password = document.querySelector("input[type='password']").value;

  if (!correo || !password) {
    alert("Correo y contraseña son obligatorios");
    return;
  }

  const { data, error } = await apiLogin(correo, password);

  if (error) {
    alert(error);
    return;
  }


  //====== GUARDAR SESIÓN ======

localStorage.setItem("usuarioActivo", JSON.stringify(data));

  if( data.tipo === "paciente") {
    window.location.href = "dashboard-paciente.html";
  } else {
    window.location.href = "dashboard-medico.html";
  }
}



/* ====== GUARDAR DATOS DEL PERFIL LIPIDICO ====== */
async function guardarDatos() {
    // 1. Obtener los valores del formulario
    const colesterol = document.getElementById("colesteroltotal").value.trim();
    const hdl = document.getElementById("colesterolhdl").value.trim();
    const ldl = document.getElementById("colesterolldl").value.trim();
    const vldl = document.getElementById("colesterolvldl").value.trim();
    const trigliceridos = document.getElementById("trigliceridos").value.trim();
    const tipomedicion = document.getElementById("tipomedicion").value;

    // 2. Comprobar los campos obligatorios
    if (!colesterol || !hdl || !ldl || !trigliceridos || !tipomedicion) {
        alert("Completa los campos obligatorios del perfil lipídico.");
        return;
    }

    // 3. Convertir los valores a números
    const valores = {
        colesterol: Number(colesterol),
        hdl: Number(hdl),
        ldl: Number(ldl),
        trigliceridos: Number(trigliceridos)
    };

    // VLDL es opcional si el laboratorio no lo informa
    if (vldl !== "") {
        valores.vldl = Number(vldl);
    }

    // 4. Validar que sean números positivos y finitos
    if (Object.values(valores).some(
        valor => !Number.isFinite(valor) || valor <= 0 || valor > 1000
    )) {
        alert("Revisa los resultados: deben ser números mayores que cero y no superar 1000 mg/dL.");
        return;
    }

    // 5. Comprobar la sesión del usuario
    const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));

    if (!usuario || !usuario.correo) {
        alert("Tu sesión no está activa. Inicia sesión nuevamente.");
        window.location.href = "index.html";
        return;
    }

    // 6. Guardar los resultados por separado en Supabase
    const { error } = await supabaseClient
        .from("registros")
        .insert([{
            usuario: usuario.correo,
            colesterol: valores.colesterol,
            colesterol_hdl: valores.hdl,
            colesterol_ldl: valores.ldl,
            colesterol_vldl: valores.vldl ?? null,
            tipo_medicion: tipomedicion,
            trigliceridos: valores.trigliceridos,
            fecha: new Date().toISOString().split("T")[0]
        }]);

    // 7. Mostrar errores si Supabase no guarda el registro
    if (error) {
        console.error("Error al guardar el perfil lipídico:", error);
        alert("No se pudieron guardar los resultados. Inténtalo nuevamente.");
        return;
    }

    // 8. Confirmar y limpiar el formulario
    alert("Perfil lipídico guardado correctamente.");

    document.getElementById("colesteroltotal").value = "";
    document.getElementById("colesterolhdl").value = "";
    document.getElementById("colesterolldl").value = "";
    document.getElementById("colesterolvldl").value = "";
    document.getElementById("trigliceridos").value = "";

    // 9. Actualizar historial y gráfica
    await mostrarHistorial();
    await crearGrafica();
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


/* ====== HISTORIAL ====== */
async function mostrarHistorial() {
    const lista = document.getElementById("historial");
    if (!lista) return;

    lista.innerHTML = "";

    const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
    if (!usuario || !usuario.correo) return;

    const { data, error } = await supabaseClient
        .from("registros")
        .select("*")
        .eq("usuario", usuario.correo)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error al consultar el historial:", error);
        lista.textContent = "No se pudo cargar el historial.";
        return;
    }

    if (!data || data.length === 0) {
        lista.textContent = "Todavía no tienes mediciones registradas.";
        return;
    }

    data.forEach((dato) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <div>
                <strong>Fecha:</strong> ${dato.fecha || "Sin fecha"}<br>
                <strong>Colesterol total:</strong> ${dato.colesterol ?? "No registrado"} mg/dL<br>
                <strong>HDL:</strong> ${dato.colesterol_hdl ?? "No registrado"} mg/dL<br>
                <strong>LDL:</strong> ${dato.colesterol_ldl ?? "No registrado"} mg/dL<br>
                <strong>VLDL:</strong> ${dato.colesterol_vldl ?? "No registrado"} mg/dL<br>
                <strong>Triglicéridos:</strong> ${dato.trigliceridos ?? "No registrados"} mg/dL
            </div>
            <button onclick="abrirModalEliminar(${Number(dato.id)})">❌</button>
        `;

        lista.appendChild(li);
    });
}


// ====== MOSTRAR USUARIO ======
function formatearNombre(nombre) {
  return nombre
        .toLowerCase()
        .split("")
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join("");

}
function mostrarUsuario() {
  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (usuario) {
    const texto = document.getElementById("bienvenida");
    if (texto) {      texto.textContent = "Bienvenido, " + formatearNombre(usuario.nombre);
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
    /* destruir grafica anterior*/

    if (graficaActual) {
    graficaActual.destroy();
    graficaActual = null;
}

const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("usuario", usuario.correo);

if (error || !data || data.length === 0) return;

    // Ordenar registros por fecha
    data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const fechas = data.map(d => d.fecha || "Sin fecha");
    const colesterol = data.map(d => d.colesterol);
    const trigliceridos = data.map(d => d.trigliceridos);

    graficaActual = new Chart(ctx, {

        type: "line",

        data: {

            labels: fechas,

            datasets: [

                {
                    label: "Colesterol",
                    data: colesterol,
                    borderColor: "#1f6fd1",
                    backgroundColor: "rgba(31, 111, 209, 0.10)",
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    tension: 0.3,
                    fill: false
                },

                {
                    label: "Triglicéridos",
                    data: trigliceridos,
                    borderColor: "#e4572e",
                    backgroundColor: "rgba(228, 87, 46, 0.10)",
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    tension: 0.3,
                    fill: false
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "top"
                }

            },

            interaction: {

                mode: "index",
                intersect: false

            },

            scales: {

                y: {

                    beginAtZero: true,

                    title: {

                        display: true,
                        text: "mg/dL"

                    }

                },

                

                x: {
                offset: false,
                ticks: {
                    padding: 2,
                    color: "#1f549f",
                    font: {
                        weight: "bold",
                        size: 12
                    }
                },
                title: {
                    display: true,
                    text: "Fecha",
                    align: "center",
                    padding: 0,
                    color: "#1f549f",
                    font: {
                        weight: "bold",
                        size: 14
                    }
                }
            }


                

            }

        }

    });

}


// ====== ELIMINAR DATO ======

let idRegistroEliminar = null;


function abrirModalEliminar(id) {

    idRegistroEliminar = id;

    document.getElementById("modalConfirmacion").style.display = "flex";

}


function cerrarModalEliminar() {

    idRegistroEliminar = null;

    document.getElementById("modalConfirmacion").style.display = "none";

}


async function confirmarEliminacion() {

    const id = idRegistroEliminar;

    cerrarModalEliminar();

    if (!id) return;

    const { error } = await supabaseClient
        .from("registros")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(error);

        mostrarMensaje(
            "Error",
            "No fue posible eliminar este registro."
        );

        return;

    }

    mostrarMensaje(
        "Registro eliminado",
        "El registro se eliminó correctamente."
    );

    await mostrarHistorial();
    await crearGrafica();

}


// ====== MODAL DE MENSAJE ======

function mostrarMensaje(titulo, texto) {

    document.getElementById("tituloMensaje").textContent = titulo;

    document.getElementById("textoMensaje").textContent = texto;

    document.getElementById("modalMensaje").style.display = "flex";

}


function cerrarModalMensaje() {

    document.getElementById("modalMensaje").style.display = "none";

}


// ====== EVENTOS DE LOS BOTONES ======

document.addEventListener("DOMContentLoaded", () => {

    const btnCancelarEliminar =
        document.getElementById("btnCancelarEliminar");

    const btnConfirmarEliminar =
        document.getElementById("btnConfirmarEliminar");

    const btnAceptarMensaje =
        document.getElementById("btnAceptarMensaje");


    if (btnCancelarEliminar) {

        btnCancelarEliminar.addEventListener(
            "click",
            cerrarModalEliminar
        );

    }


    if (btnConfirmarEliminar) {

        btnConfirmarEliminar.addEventListener(
            "click",
            confirmarEliminacion
        );

    }


    if (btnAceptarMensaje) {

        btnAceptarMensaje.addEventListener(
            "click",
            cerrarModalMensaje
        );

    }

});

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

const boton = document.createElement("button");
boton.textContent = paciente.nombre;
boton.dataset.correo = paciente.correo;

boton.addEventListener("click", () => {
    mostrarHistorialPaciente(paciente.correo);
});

li.appendChild(boton);
lista.appendChild(li);

  });
}


/* ====== HISTORIAL DE PACIENTE (médico) ====== */
async function mostrarHistorialPaciente(correo) {
    const tabla = document.getElementById("historialPaciente");

    if (!tabla) return;

    // Resaltar el paciente seleccionado
document.querySelectorAll("#listaPacientes li button").forEach((boton) => {
    const correoBoton = boton.dataset.correo;

    boton.classList.toggle(
        "paciente-seleccionado",
        correoBoton === correo
    );
});

    const tbody = tabla.querySelector("tbody");
    tbody.innerHTML = "";

    const { data, error } = await supabaseClient
        .from("registros")
        .select("*")
        .eq("usuario", correo)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error al consultar el historial del paciente:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6">No se pudo cargar el historial.</td>
            </tr>
        `;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Este paciente no tiene registros.</td>
            </tr>
        `;
        return;
    }

    data.forEach((registro) => {
        const tr = document.createElement("tr");

        const valores = [
            registro.fecha || "Sin fecha",
            registro.colesterol ?? "No registrado",
            registro.colesterol_hdl ?? "No registrado",
            registro.colesterol_ldl ?? "No registrado",
            registro.colesterol_vldl ?? "No registrado",
            registro.trigliceridos ?? "No registrados"
        ];

        valores.forEach((valor) => {
            const td = document.createElement("td");
            td.textContent = valor;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// ====== TOGGLE(Mostrar/Ocultar) ======
function toggle(elementId) {
  const element = document.getElementById(elementId);
  if (element.style.display === "none") {
    element.style.display = "block";
  } else {
    element.style.display = "none";
  }
} 


/* ==========================================
   GESTIÓN DE CITAS - LIPOCONTROL
   ========================================== */

// Cargar pacientes en el selector de citas
async function cargarPacientesCitas() {
    const selector = document.getElementById("paciente");
    if (!selector) return;

    selector.innerHTML = '<option value="">Cargando pacientes...</option>';

    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("nombre, correo")
        .eq("tipo", "paciente");

    if (error) {
        console.error("Error al cargar pacientes:", error);
        selector.innerHTML =
            '<option value="">No se pudieron cargar los pacientes</option>';
        return;
    }

    selector.innerHTML =
        '<option value="">-- Seleccionar paciente --</option>';

    (data || []).forEach((paciente) => {
        const opcion = document.createElement("option");
        opcion.value = paciente.correo;
        opcion.textContent = paciente.nombre;
        selector.appendChild(opcion);
    });
}


// Registrar una cita

function obtenerFechaLocal() {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}


function obtenerFechaLocal() {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}
    event.preventDefault();

    const paciente = document.getElementById("paciente").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("horacita").value;
    const lugar = document.getElementById("lugarcita").value.trim();
    const motivo = document.getElementById("motivocita").value.trim();

    if (!paciente || !fecha || !hora || !lugar || !motivo) {
        alert("Completa todos los campos para agendar la cita.");
        return;
    }

    
if (fecha < obtenerFechaLocal()) {
    alert("La fecha de la cita no puede estar en el pasado.");
    return;
}


    const { error } = await supabaseClient
        .from("citas")
        .insert([{
            paciente_correo: paciente,
            fecha: fecha,
            hora: hora,
            lugar: lugar,
            motivo: motivo,
            estado: "Programada"
        }]);

    if (error) {
        console.error("Error al agendar la cita:", error);
        alert("No se pudo guardar la cita. Revisa la consola y los permisos de Supabase.");
        return;
    }

    alert("¡Cita agendada correctamente!");

    document.getElementById("formulariocitas").reset();

    await mostrarCitas();


// Consultar y mostrar las citas registradas
async function mostrarCitas() {
    const lista = document.getElementById("listaCitas");
    if (!lista) return;

    lista.innerHTML = "<li>Cargando citas...</li>";

    const { data: citas, error } = await supabaseClient
        .from("citas")
        .select("*")
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true });

    if (error) {
        console.error("Error al consultar citas:", error);
        lista.innerHTML = "<li>No se pudieron cargar las citas.</li>";
        return;
    }

    lista.innerHTML = "";

    if (!citas || citas.length === 0) {
        lista.innerHTML = "<li>No hay citas registradas.</li>";
        return;
    }

    // Obtener nombres de los pacientes
    const { data: pacientes, error: errorPacientes } = await supabaseClient
        .from("usuarios")
        .select("nombre, correo")
        .eq("tipo", "paciente");

    if (errorPacientes) {
        console.error("Error al consultar pacientes:", errorPacientes);
    }

    const nombres = new Map(
        (pacientes || []).map((paciente) => [
            paciente.correo,
            paciente.nombre
        ])
    );

    citas.forEach((cita) => {
        const li = document.createElement("li");

        const nombrePaciente =
            nombres.get(cita.paciente_correo) || cita.paciente_correo;

        const detalle = document.createElement("div");
        detalle.textContent =
            `${nombrePaciente} | ${cita.fecha} | ${String(cita.hora).slice(0, 5)} | ` +
            `${cita.lugar} | ${cita.motivo} | Estado: ${cita.estado}`;

        li.appendChild(detalle);
        lista.appendChild(li);
    });
}
