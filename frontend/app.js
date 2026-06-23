
const API = 'http://localhost:3000';

fetch(`${API}/productos`)
  .then(res => res.json())
  .then(data => {
    const tabla = document.getElementById('tabla-productos');

    data.forEach(p => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>
          <button onclick="vender(${p.id})">Vender</button>
        </td>
      `;

      tabla.appendChild(tr);
    });
  });

window.vender = function(producto_id) {
  const cantidad = prompt("¿Cuántos quieres vender?");

  fetch(`${API}/ventas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      producto_id,
      cantidad: parseInt(cantidad)
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(JSON.stringify(data));
    location.reload();
  });
};




async function cargarProductos() {
  const res = await fetch('http://localhost:3000/productos');
  const productos = await res.json();

  const select = document.getElementById('producto_id');
  const tabla = document.getElementById('tabla-productos');

  select.innerHTML = '<option value="">Selecciona un producto</option>';
  tabla.innerHTML = '';

  productos.forEach(p => {
    
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = `${p.nombre} - ${p.modelo} - ${p.color} (${p.capacidad}) | Stock: ${p.cantidad}`;
    select.appendChild(option);

    
    const fila = `
      <tr>
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.modelo}</td>
        <td>${p.color}</td>
        <td>${p.capacidad}</td>
        <td>${p.cantidad}</td>
        <td><button onclick="seleccionarProducto(${p.id})">Seleccionar</button></td>
      </tr>
    `;
    tabla.innerHTML += fila;
  });
}

function seleccionarProducto(id) {
  document.getElementById('producto_id').value = id;
  document.getElementById('buscador').value = '';
}

async function registrarVenta() {
    const selectProducto = document.getElementById('producto_id'); // Referencia al select
    const producto_id = selectProducto.value;
    
    // Obtenemos el texto que el usuario está viendo en el select (el nombre del producto)
    const nombreProducto = selectProducto.options[selectProducto.selectedIndex].text;
    
    const cantidad = document.getElementById('cantidad').value;
    const precio = document.getElementById('precio').value;

    // Validación básica antes de enviar
    if (!producto_id || !cantidad || !precio) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const res = await fetch('http://localhost:3000/ventas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') // Enviamos el token de seguridad
        },
        body: JSON.stringify({ producto_id, cantidad, precio })
    });

    const data = await res.json();

    if (res.ok) {
        alert("Venta registrada con éxito");

        // Llamamos a la función del ticket usando el nombre que sacamos del select
        generarTicket({
            nombre: nombreProducto,
            cantidad: cantidad,
            precio: precio
        });

        cargarProductos(); // Refrescamos la tabla para ver el stock actualizado
    } else {
        alert("Error al registrar venta: " + (data.error || data.mensaje));
    }
}
cargarProductos();


async function registrarProductos() {
  const nombre = document.getElementById('nombre').value;
  const modelo = document.getElementById('modelo').value;
  const color = document.getElementById('color').value;
  const capacidad = document.getElementById('capacidad').value;
  const cantidad = document.getElementById('cantidad').value;
  

  const res = await fetch('http://localhost:3000/productos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nombre, modelo, color, capacidad, cantidad })
  });

  const data = await res.json();
  alert(data.mensaje);

  cargarProductos(); 
}


async function hacerLogin() {
    const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('token', data.token); // Guardamos el token
        window.location.href = 'admin.html'; // Redirigimos
    } else {
        alert(data.error);
    }
}


function generarTicket(datosVenta) {
    const { jsPDF } = window.jspdf;
    
    // Creamos un formato de página pequeño (80mm de ancho por 150mm de alto)
    const doc = new jsPDF({
        unit: "mm",
        format: [80, 150] 
    });

    // Configuración de texto
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.text("JC PUBLICIDAD", 40, 10, { align: "center" });
    
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text("RFC: JCI900101XX1", 40, 15, { align: "center" });
    doc.text("Calle Ignacio Allende #336, Los Mochis, SIN", 40, 19, { align: "center" });
    doc.text("--------------------------------", 40, 24, { align: "center" });

    // Datos de la venta
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 30);
    doc.text(`Ticket No: ${Math.floor(Math.random() * 10000)}`, 5, 35);
    doc.text("--------------------------------", 40, 40, { align: "center" });

    // Detalle del producto
    doc.setFont("courier", "bold");
    doc.text("CONCEPTO", 5, 45);
    doc.text("CANT", 45, 45);
    doc.text("TOTAL", 65, 45);
    
    doc.setFont("courier", "normal");
    doc.text(`${datosVenta.nombre.substring(0, 15)}`, 5, 52); 
    doc.text(`${datosVenta.cantidad}`, 48, 52);
    doc.text(`$${(datosVenta.cantidad * datosVenta.precio).toLocaleString()}`, 65, 52);

    doc.text("--------------------------------", 40, 60, { align: "center" });
    
    // Total
    doc.setFontSize(11);
    doc.setFont("courier", "bold");
    doc.text(`TOTAL: $${(datosVenta.cantidad * datosVenta.precio).toLocaleString()}`, 65, 68, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("courier", "normal");
    doc.text("¡Gracias por su compra!", 40, 80, { align: "center" });
    doc.text("No se aceptan devoluciones", 40, 85, { align: "center" });

    
    doc.save(`Ticket_Venta_${Date.now()}.pdf`);
    
    console.log("Ticket generado con éxito");
}