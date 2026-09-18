import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const DRIVE_ROOT = 'D:/PapusCloud/drive';
const CINE_ROOT = 'D:/PapusCloud/cine';

// Asegurar existencia de directorios base
fs.mkdirSync(path.join(DRIVE_ROOT, 'public'), { recursive: true });
fs.mkdirSync(path.join(DRIVE_ROOT, 'users'), { recursive: true });
fs.mkdirSync(CINE_ROOT, { recursive: true });

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// ----------------------------------------------------
// STORAGE CONFIG (Multer)
// ----------------------------------------------------
const driveStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPublic = req.body.is_public === '1' || req.body.is_public === true;
    const username = req.body.username || 'papu';
    let dest = path.join(DRIVE_ROOT, 'public');
    if (!isPublic) {
      dest = path.join(DRIVE_ROOT, 'users', username);
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`);
  }
});

const uploadDrive = multer({ storage: driveStorage });

const cineStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CINE_ROOT);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const uploadCine = multer({ storage: cineStorage });

// ----------------------------------------------------
// 1. AUTH API
// ----------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña requeridos.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUser);
  if (existing) {
    return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso por otro Papu.' });
  }

  // Primer usuario creado es Admin
  const countUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const role = countUsers === 0 ? 'admin' : 'papu';

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run(cleanUser, hash, role);

  res.json({
    success: true,
    user: { id: result.lastInsertRowid, username: cleanUser, role }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan credenciales.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUser);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  res.json({
    success: true,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// Stats generales
app.get('/api/stats', (req, res) => {
  const fileCount = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size FROM drive_files').get();
  const mediaCount = db.prepare('SELECT COUNT(*) as count FROM cine_media').get().count;
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  res.json({
    files: fileCount.count,
    totalStorageUsedBytes: fileCount.total_size,
    movies: mediaCount,
    users: userCount
  });
});

// ----------------------------------------------------
// 2. PAPUSDRIVE API
// ----------------------------------------------------
app.get('/api/drive/files', (req, res) => {
  const userId = req.query.userId;
  let rows;
  if (userId) {
    rows = db.prepare(`
      SELECT f.*, u.username as owner 
      FROM drive_files f 
      JOIN users u ON f.user_id = u.id 
      WHERE f.is_public = 1 OR f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);
  } else {
    rows = db.prepare(`
      SELECT f.*, u.username as owner 
      FROM drive_files f 
      JOIN users u ON f.user_id = u.id 
      WHERE f.is_public = 1
      ORDER BY f.created_at DESC
    `).all();
  }
  res.json({ files: rows });
});

app.post('/api/drive/upload', uploadDrive.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo.' });
  }

  const { user_id, is_public } = req.body;
  const userId = parseInt(user_id) || 1;
  const publicFlag = (is_public === '1' || is_public === true) ? 1 : 0;

  const result = db.prepare(`
    INSERT INTO drive_files (user_id, filename, original_name, file_path, file_size, mime_type, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    req.file.filename,
    req.file.originalname,
    req.file.path,
    req.file.size,
    req.file.mimetype,
    publicFlag
  );

  res.json({
    success: true,
    fileId: result.lastInsertRowid,
    filename: req.file.originalname,
    size: req.file.size
  });
});

app.get('/api/drive/download/:id', (req, res) => {
  const file = db.prepare('SELECT * FROM drive_files WHERE id = ?').get(req.params.id);
  if (!file || !fs.existsSync(file.file_path)) {
    return res.status(404).json({ error: 'Archivo no encontrado en el disco D:.' });
  }

  db.prepare('UPDATE drive_files SET downloads = downloads + 1 WHERE id = ?').run(file.id);
  res.download(file.file_path, file.original_name);
});

app.get('/api/drive/preview/:id', (req, res) => {
  const file = db.prepare('SELECT * FROM drive_files WHERE id = ?').get(req.params.id);
  if (!file || !fs.existsSync(file.file_path)) {
    return res.status(404).json({ error: 'Archivo no encontrado.' });
  }

  res.sendFile(path.resolve(file.file_path));
});

app.delete('/api/drive/:id', (req, res) => {
  const file = db.prepare('SELECT * FROM drive_files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'Archivo no encontrado.' });

  try {
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
  } catch (err) {
    console.error('Error al borrar de disco:', err);
  }

  db.prepare('DELETE FROM drive_files WHERE id = ?').run(file.id);
  res.json({ success: true });
});

// ----------------------------------------------------
// 3. CINEPAPUS API (Streaming HTTP 206)
// ----------------------------------------------------
app.get('/api/cine/catalog', (req, res) => {
  const media = db.prepare('SELECT * FROM cine_media ORDER BY created_at DESC').all();
  res.json({ catalog: media });
});

// Escaneo automático de la carpeta D:\PapusCloud\cine
app.post('/api/cine/scan', (req, res) => {
  try {
    const files = fs.readdirSync(CINE_ROOT);
    const videoExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi'];
    let addedCount = 0;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (videoExtensions.includes(ext)) {
        const fullPath = path.join(CINE_ROOT, file);
        const title = path.basename(file, ext);
        const existing = db.prepare('SELECT id FROM cine_media WHERE file_path = ?').get(fullPath);

        if (!existing) {
          db.prepare(`
            INSERT INTO cine_media (title, description, file_path, category)
            VALUES (?, ?, ?, ?)
          `).run(title, 'Disponible en la videoteca de Los Papus.', fullPath, 'Películas');
          addedCount++;
        }
      }
    }

    res.json({ success: true, added: addedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cine/upload', uploadCine.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió archivo de video.' });

  const title = req.body.title || path.basename(req.file.originalname, path.extname(req.file.originalname));
  const description = req.body.description || 'Subido a CinePapus';
  const category = req.body.category || 'Películas';

  const result = db.prepare(`
    INSERT INTO cine_media (title, description, file_path, category)
    VALUES (?, ?, ?, ?)
  `).run(title, description, req.file.path, category);

  res.json({ success: true, id: result.lastInsertRowid, title });
});

// Streaming de video con HTTP 206 Range Requests (Crucial para seeking fluido)
app.get('/api/cine/stream/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM cine_media WHERE id = ?').get(req.params.id);
  if (!item || !fs.existsSync(item.file_path)) {
    return res.status(404).send('Video no encontrado.');
  }

  const filePath = item.file_path;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// ----------------------------------------------------
// 4. WEBSOCKETS (WATCH PARTY SYNC + CHAT EN VIVO)
// ----------------------------------------------------
const rooms = new Map(); // roomId -> { mediaId, currentTime, isPlaying, host, clients: Set<WebSocket> }

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    const dbRoom = db.prepare('SELECT * FROM watch_rooms WHERE id = ?').get(roomId);
    rooms.set(roomId, {
      mediaId: dbRoom?.media_id || null,
      currentTime: dbRoom?.current_time || 0,
      isPlaying: false,
      clients: new Set()
    });
  }
  return rooms.get(roomId);
}

wss.on('connection', (ws) => {
  let currentRoomId = null;
  let username = 'Papu Anónimo';

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'JOIN_ROOM': {
          currentRoomId = msg.roomId || 'general';
          username = msg.username || 'Papu';
          const room = getOrCreateRoom(currentRoomId);
          room.clients.add(ws);

          // Enviar estado actual de la sala al usuario que acaba de entrar
          ws.send(JSON.stringify({
            type: 'ROOM_SYNC',
            mediaId: room.mediaId,
            currentTime: room.currentTime,
            isPlaying: room.isPlaying
          }));

          // Notificar a la sala
          broadcastToRoom(currentRoomId, {
            type: 'USER_JOINED',
            username,
            onlineCount: room.clients.size
          });
          break;
        }

        case 'LOAD_MEDIA': {
          if (!currentRoomId) return;
          const room = getOrCreateRoom(currentRoomId);
          room.mediaId = msg.mediaId;
          room.currentTime = 0;
          room.isPlaying = true;

          db.prepare('UPDATE watch_rooms SET media_id = ?, current_time = 0, is_playing = 1 WHERE id = ?')
            .run(msg.mediaId, currentRoomId);

          broadcastToRoom(currentRoomId, {
            type: 'MEDIA_LOADED',
            mediaId: msg.mediaId,
            by: username
          });
          break;
        }

        case 'PLAY': {
          if (!currentRoomId) return;
          const room = getOrCreateRoom(currentRoomId);
          room.isPlaying = true;
          room.currentTime = msg.currentTime || room.currentTime;

          broadcastToRoom(currentRoomId, {
            type: 'PLAY',
            currentTime: room.currentTime,
            by: username
          }, ws);
          break;
        }

        case 'PAUSE': {
          if (!currentRoomId) return;
          const room = getOrCreateRoom(currentRoomId);
          room.isPlaying = false;
          room.currentTime = msg.currentTime || room.currentTime;

          broadcastToRoom(currentRoomId, {
            type: 'PAUSE',
            currentTime: room.currentTime,
            by: username
          }, ws);
          break;
        }

        case 'SEEK': {
          if (!currentRoomId) return;
          const room = getOrCreateRoom(currentRoomId);
          room.currentTime = msg.currentTime || 0;

          broadcastToRoom(currentRoomId, {
            type: 'SEEK',
            currentTime: room.currentTime,
            by: username
          }, ws);
          break;
        }

        case 'CHAT_MESSAGE': {
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            type: 'CHAT_MESSAGE',
            username,
            text: msg.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          break;
        }
      }
    } catch (err) {
      console.error('Error WebSocket:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId);
      room.clients.delete(ws);
      broadcastToRoom(currentRoomId, {
        type: 'USER_LEFT',
        username,
        onlineCount: room.clients.size
      });
    }
  });
});

function broadcastToRoom(roomId, message, senderWs = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const client of room.clients) {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      client.send(payload);
    }
  }
}

// ----------------------------------------------------
// INICIO DEL SERVIDOR
// ----------------------------------------------------
const PORT = process.env.PORT || 4500;
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 PAPUSCLOUD ONLINE EN http://localhost:${PORT}`);
  console.log(`📁 PapusDrive listo en D:\\PapusCloud\\drive`);
  console.log(`🎬 CinePapus listo en D:\\PapusCloud\\cine`);
  console.log(`🍿 Watch Party WebSocket activo`);
  console.log(`=================================================`);
});
