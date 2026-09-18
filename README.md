# PapusCloud

Plataforma privada de almacenamiento en la nube y reproductor multimedia con salas sincronizadas (Watch Party) para el ecosistema de Los Papus.

## Modulos

### 1. PapusDrive
- Almacenamiento directo en disco secundario (D:).
- Separacion de archivos publicos (para todo el grupo) y privados por usuario.
- Carga de archivos pesados sin limites de cuota arbitrarios.
- Previsualizacion integrada para imagenes, audio, video y documentos en el navegador.
- Enlaces de descarga directa de alta velocidad.

### 2. CinePapus
- Streaming de video de alto rendimiento con soporte HTTP 206 Partial Content (Range Requests).
- Sincronizacion de reproduccion en tiempo real entre multiples clientes mediante WebSockets (Play, Pause, Seek).
- Chat interactivo integrado en cada sala.
- Indexacion automatica de archivos de video mediante escaneo de directorios locales.
- Interfaz cinematografica con acentos y estetica inspirada en plataformas de streaming.

## Arquitectura

- Backend: Node.js, Express, WebSockets (ws), Multer.
- Base de datos: Motor nativo node:sqlite (SQLite integrado en Node.js runtime).
- Frontend: HTML5 semantico, CSS3 con diseño responsivo oscuro y logos vectoriales SVG nativos, JavaScript modular.
- Almacenamiento persistente: Directorios dedicados en disco secundario (D:\PapusCloud\).

## Instalacion y Ejecucion

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor:
```bash
npm start
```

3. Acceso local:
Abrir http://localhost:4500 en el navegador.

4. Exposicion remota para usuarios externos:
```bash
ngrok http 4500
```
