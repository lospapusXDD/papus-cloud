import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = 'D:/PapusCloud/data';
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'papuscloud.db');
export const db = new DatabaseSync(DB_PATH);

// Habilitar WAL mode para máximo rendimiento concurrente
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Inicializar Tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'papu',
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS drive_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    is_public INTEGER DEFAULT 1,
    downloads INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cine_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    duration REAL DEFAULT 0,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'Películas',
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS watch_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    media_id INTEGER,
    current_time REAL DEFAULT 0,
    is_playing INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(media_id) REFERENCES cine_media(id) ON DELETE SET NULL
  );
`);

// Crear sala por defecto para Watch Party si no existe
const checkRoom = db.prepare('SELECT id FROM watch_rooms WHERE id = ?').get('general');
if (!checkRoom) {
  db.prepare('INSERT INTO watch_rooms (id, name) VALUES (?, ?)').run('general', '🍿 Sala Principal Papus');
}

console.log('✅ Base de datos SQLite (node:sqlite) lista en:', DB_PATH);
