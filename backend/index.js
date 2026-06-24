require('dotenv').config();
const express = require('express');
const db = require('./db');
const app = express();
const cors = require('cors');
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API funcionando ');
});

const PORT = process.env.PORT || 3000;

app.listen(3000, () => {
  console.log('Servidor en ${PORT}');
});

app.get('/productos', (req, res) => {
  db.query('SELECT * FROM productos ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en la consulta' });
    }
    res.json(results);
  });
});

app.post('/ventas', (req, res) => {
  const { producto_id, cantidad, precio } = req.body;

  const sql = 'INSERT INTO ventas (producto_id, cantidad, precio) VALUES (?, ?, ?)';

  db.query(sql, [producto_id, cantidad, precio], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: err.sqlMessage });
    }

    res.json({ mensaje: 'Venta registrada correctamente' });
  });
});

app.get('/ventas', (req, res) => {
  const sql = `
    SELECT 
      ventas.id,
      productos.nombre,
      productos.modelo,
      productos.color,
      productos.capacidad,
      ventas.cantidad,
      ventas.precio,
      ventas.fecha
    FROM ventas
    JOIN productos ON ventas.producto_id = productos.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener ventas' });
    }
    res.json(results);
  });
});

app.get('/reportes/mas-vendido', (req, res) => {
  const sql = `
    SELECT 
    productos.nombre,
    SUM(ventas.cantidad) AS total_vendido
    FROM ventas
    JOIN productos ON ventas.producto_id = productos.id
    GROUP BY ventas.producto_id
    ORDER BY total_vendido DESC
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

app.get('/reportes/ventas', (req, res) => {
  const sql = `
    SELECT 
      productos.nombre,
      SUM(ventas.cantidad) AS total_vendido
    FROM ventas
    JOIN productos ON ventas.producto_id = productos.id
    GROUP BY productos.nombre
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

app.post('/productos', (req, res) => {
  const { nombre, modelo, color, capacidad, cantidad } = req.body;

  const sql = `
    INSERT INTO productos (nombre, modelo, color, capacidad, cantidad)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    cantidad = cantidad + VALUES(cantidad)
  `;

  db.query(sql, [nombre, modelo, color, capacidad, cantidad], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ error: err.sqlMessage });
    }

    res.json({ mensaje: 'Producto agregado o actualizado correctamente' });
  });
});


app.post('/update/productos', (req, res) => {

  const { id, cantidad } = req.body;

  const sql = 'UPDATE productos SET cantidad = ? WHERE id = ?';

  db.query(sql, [cantidad, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al actualizar la base de datos" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "No se encontró el producto con ese ID" });
    }

    res.json({ mensaje: 'Stock actualizado correctamente' });
  });
});


app.delete('/productos/:id', (req, res) => {
  const { id } = req.params; // Obtenemos el ID de la URL

  const sql = 'DELETE FROM productos WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar el producto' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'No se encontró el producto' });
    }

    res.json({ mensaje: 'Producto eliminado correctamente' });
  });
});



app.listen(3000, () => {
    console.log('Servidor corriendo en https://jc-system-v2.onrender.com');
});


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "tu_clave_secreta_super_segura"; //.env


app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query('INSERT INTO usuarios (username, password) VALUES (?, ?)', 
    [username, hashedPassword], (err) => {
        if (err) return res.status(400).json({ error: "Usuario ya existe" });
        res.json({ mensaje: "Usuario creado" });
    });
});

// RUTA DE LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

        const usuario = results[0];
        const passwordCorrecto = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecto) return res.status(401).json({ error: "Contraseña incorrecta" });

        // Si todo está bien, creamos el Token
        const token = jwt.sign({ id: usuario.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ mensaje: "Bienvenido", token });
    });
});

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: "No hay token, acceso denegado" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token inválido" });
        req.usuarioId = decoded.id;
        next();
    });
};







app.post('/update/productos', verificarToken, (req, res) => {
  
});
