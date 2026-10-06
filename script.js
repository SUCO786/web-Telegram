
const token = document.getElementById("token");
const nombreDestinatario = document.getElementById("nombreDestinatario");
const chatIdDestinatario = document.getElementById("chatIdDestinatario");
const guardarDestinatario = document.getElementById("guardarDestinatario");
const listaDestinatarios = document.getElementById("listaDestinatarios");
const destinatarioSelect = document.getElementById("destinatarioSelect");
const chatId = document.getElementById("chatId");
const mensaje = document.getElementById("mensaje");
const enviar = document.getElementById("enviar");
const limpiar = document.getElementById("limpiar");
const estado = document.getElementById("estado");
const contador = document.getElementById("contador");

const CLAVE_DESTINATARIOS = "telegramDestinatarios";

let destinatarios = cargarDatos();

function cargarDatos() {
  try {
    const datos = JSON.parse(
      localStorage.getItem(CLAVE_DESTINATARIOS) || "[]"
    );

    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function guardarDatos() {
  localStorage.setItem(
    CLAVE_DESTINATARIOS,
    JSON.stringify(destinatarios)
  );
}

function mostrarEstado(texto, tipo = "") {
  estado.textContent = texto;
  estado.className = tipo;
}

function renderizarDestinatarios() {
  listaDestinatarios.replaceChildren();
  destinatarioSelect.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.textContent = "Selecciona un destinatario";
  destinatarioSelect.appendChild(opcionInicial);

  if (destinatarios.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "Todavía no hay destinatarios guardados.";
    listaDestinatarios.appendChild(vacio);
    return;
  }

  destinatarios.forEach((destinatario) => {
    // Opción del menú desplegable
    const opcion = document.createElement("option");
    opcion.value = destinatario.id;
    opcion.textContent = destinatario.nombre;
    destinatarioSelect.appendChild(opcion);

    // Tarjeta del destinatario
    const tarjeta = document.createElement("div");
    tarjeta.className = "destinatario";

    const informacion = document.createElement("div");
    informacion.className = "destinatario-info";

    const nombre = document.createElement("strong");
    nombre.textContent = destinatario.nombre;

    const id = document.createElement("span");
    id.textContent = "Chat ID: " + destinatario.chatId;

    informacion.append(nombre, id);

    const acciones = document.createElement("div");
    acciones.className = "acciones-destinatario";

    const botonUsar = document.createElement("button");
    botonUsar.type = "button";
    botonUsar.className = "boton boton-usar";
    botonUsar.textContent = "Usar";

    botonUsar.addEventListener("click", () => {
      destinatarioSelect.value = destinatario.id;
      chatId.value = destinatario.chatId;
      mostrarEstado("Destinatario seleccionado.");
      document.getElementById("mensaje").focus();
    });

    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.className = "boton boton-eliminar";
    botonEliminar.textContent = "Eliminar";

    botonEliminar.addEventListener("click", () => {
      const confirmar = window.confirm(
        `¿Quieres eliminar a ${destinatario.nombre}?`
      );

      if (!confirmar) return;

      destinatarios = destinatarios.filter(
        (item) => item.id !== destinatario.id
      );

      guardarDatos();

      if (destinatarioSelect.value === destinatario.id) {
        destinatarioSelect.value = "";
        chatId.value = "";
      }

      renderizarDestinatarios();
      mostrarEstado("Destinatario eliminado.", "exito");
    });

    acciones.append(botonUsar, botonEliminar);
    tarjeta.append(informacion, acciones);
    listaDestinatarios.appendChild(tarjeta);
  });
}

// Guardar un destinatario
guardarDestinatario.addEventListener("click", () => {
  const nombre = nombreDestinatario.value.trim();
  const idChat = chatIdDestinatario.value.trim();

  if (!nombre || !idChat) {
    mostrarEstado("Escribe el nombre y el Chat ID.", "error");
    return;
  }

  if (!/^-?\d+$/.test(idChat)) {
    mostrarEstado(
      "El Chat ID debe contener números. Comprueba el dato.",
      "error"
    );
    return;
  }

  const existente = destinatarios.find(
    (item) => item.chatId === idChat
  );

  if (existente) {
    existente.nombre = nombre;
    mostrarEstado(
      "El destinatario ya existía. Se actualizó su nombre.",
      "exito"
    );
  } else {
    destinatarios.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      nombre: nombre,
      chatId: idChat
    });

    mostrarEstado("Destinatario guardado correctamente.", "exito");
  }

  guardarDatos();
  renderizarDestinatarios();

  nombreDestinatario.value = "";
  chatIdDestinatario.value = "";
});

// Seleccionar desde el menú
destinatarioSelect.addEventListener("change", () => {
  const seleccionado = destinatarios.find(
    (item) => item.id === destinatarioSelect.value
  );

  chatId.value = seleccionado ? seleccionado.chatId : "";

  if (seleccionado) {
    mostrarEstado("Destinatario seleccionado.");
  }
});

// Contador de caracteres
mensaje.addEventListener("input", () => {
  contador.textContent = `${mensaje.value.length} / 4000 caracteres`;
});

// Enviar mensaje a Telegram
enviar.addEventListener("click", async () => {
  const tokenBot = token.value.trim();
  const chatDestino = chatId.value.trim();
  const textoMensaje = mensaje.value.trim();

  if (!tokenBot || !chatDestino || !textoMensaje) {
    mostrarEstado(
      "Completa el token, el Chat ID y el mensaje.",
      "error"
    );
    return;
  }

  if (!/^-?\d+$/.test(chatDestino)) {
    mostrarEstado("El Chat ID debe contener números.", "error");
    return;
  }

  const mensajeFinal = `💬 Mensaje:\n\n${textoMensaje}`;

  enviar.disabled = true;
  enviar.textContent = "Enviando...";
  mostrarEstado("Enviando mensaje a Telegram...");

  try {
    const url =
      `https://api.telegram.org/bot${tokenBot}/sendMessage`;

    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatDestino,
        text: mensajeFinal
      })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok || !resultado.ok) {
      throw new Error(
        resultado.description || "Telegram no pudo enviar el mensaje."
      );
    }

    mostrarEstado("¡Mensaje enviado correctamente!", "exito");
    mensaje.value = "";
    contador.textContent = "0 / 4000 caracteres";
  } catch (error) {
    mostrarEstado(
      "No se pudo enviar el mensaje. " +
      (error.message || "Comprueba tu conexión, el token y el Chat ID."),
      "error"
    );
  } finally {
    enviar.disabled = false;
    enviar.textContent = "➤ Enviar mensaje";
  }
});

// Limpiar el campo del mensaje
limpiar.addEventListener("click", () => {
  mensaje.value = "";
  contador.textContent = "0 / 4000 caracteres";
  mostrarEstado("Mensaje limpiado.");
});

// Cargar destinatarios guardados al abrir la página
renderizarDestinatarios();