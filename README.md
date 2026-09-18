# PapusCloud — Nube Privada & Streaming CinePapus

Plataforma completa de almacenamiento en la nube privado y reproductor de películas y series en streaming con cuentas independientes para el ecosistema de Los Papus.

---

## 🌐 Enlace a la Web Online (GitHub Pages)

Accede a la versión web directamente sin instalar nada:
👉 **[https://lospapusxdd.github.io/papus-cloud/](https://lospapusxdd.github.io/papus-cloud/)**

*(Para activarlo en tu repositorio: ve a **Settings** > **Pages** > en **Branch** elige `main` y carpeta `/ (root)` > haz clic en **Save**).*

---

## 🚀 Características Principales

### 1. 🎬 CinePapus (Buscador & Streaming estilo Netflix / Seeke)
- **Buscador Universal de Películas y Series:** Escribe cualquier película, serie completa o anime (Breaking Bad, Spider-Man, Stranger Things, Interestelar, etc.) y reprodúcela al instante.
- **Selector de Temporadas y Capítulos:** Control completo para series de TV (Temporadas 1 a 10 y episodios con avance automático).
- **Múltiples Servidores de Streaming:**
  - Servidor 1: MultiEmbed (con doblaje en español / latino y subtítulos).
  - Servidor 2: VidSrc CC.
  - Servidor 3: AutoEmbed.
  - Servidor 4: VidSrc XYZ.
- **Mi Lista Personal:** Guarda tus películas y series favoritas de forma individual en tu propia cuenta.
- **Historial de Reproducción:** Recuerda qué capítulo estabas viendo.
- **Watch Party:** Sincronización en vivo de reproducción y chat integrado para ver contenido en grupo.

### 2. 📁 PapusDrive (Almacenamiento por Usuario)
- **Cuentas 100% Independientes:** Cada usuario se crea su cuenta y tiene su propio Drive privado donde solo él puede ver y gestionar sus archivos.
- **Pestaña de Drive Compartido:** Opción para compartir archivos públicamente con todos los demás Papus.
- **Límite Estricto de 500 GB:** Configurado exactamente para proteger el disco `D:` y dejar libres los 1.5 TB restantes para tus juegos y programas.
- **Previsualización en Línea:** Abre fotos, reproduce videos y escucha audios sin necesidad de descargarlos.

---

## 💻 Ejecución Local con Disco D:

Si deseas sincronizar los archivos y videos directamente en tu disco local `D:\PapusCloud`:

1. Iniciar el servidor local:
```bash
npm start
```

2. Abrir en el navegador:
```
http://localhost:4500
```

3. Compartir con tus amigos por internet de forma segura:
```bash
ngrok http 4500
```
