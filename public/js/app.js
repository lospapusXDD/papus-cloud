// ==========================================
// PAPUSCLOUD — CLIENT LOGIC (DRIVE & CINE)
// ==========================================

let currentUser = null;
let currentTab = 'drive';
let allDriveFiles = [];
let activeFilter = 'all';
let currentMediaId = null;
let isRemoteSync = false;
let ws = null;

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  loadDriveFiles();
  loadCineCatalog();
  setupDragAndDrop();
  setupWebSocket();
});

// ------------------------------------------
// 1. AUTENTICACIÓN
// ------------------------------------------
function initAuth() {
  const saved = localStorage.getItem('papus_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateAuthUI();
    } catch (e) {
      currentUser = null;
    }
  }
}

function updateAuthUI() {
  const unlogged = document.getElementById('unloggedView');
  const logged = document.getElementById('loggedView');
  const userText = document.getElementById('usernameText');

  if (currentUser) {
    unlogged.classList.add('hidden');
    logged.classList.remove('hidden');
    userText.innerHTML = escapeHtml(currentUser.username) + (currentUser.role === 'admin' ? ' <span class="badge-admin">ADMIN</span>' : '');
  } else {
    unlogged.classList.remove('hidden');
    logged.classList.add('hidden');
  }
}

let authMode = 'login'; // 'login' | 'register'

function openAuthModal(mode = 'login') {
  authMode = mode;
  document.getElementById('authModalTitle').textContent = mode === 'login' ? 'Iniciar Sesión' : 'Registrar Nuevo Papu';
  document.getElementById('authSubmitBtn').textContent = mode === 'login' ? 'Entrar' : 'Crear Cuenta';
  document.getElementById('authSwitchPrompt').textContent = mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?';
  document.getElementById('authSwitchLink').textContent = mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión';
  document.getElementById('authErrorMsg').classList.add('hidden');
  document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
  openAuthModal(authMode === 'login' ? 'register' : 'login');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const errBox = document.getElementById('authErrorMsg');

  const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      errBox.textContent = data.error || 'Error al autenticar.';
      errBox.classList.remove('hidden');
      return;
    }

    currentUser = data.user;
    localStorage.setItem('papus_user', JSON.stringify(currentUser));
    updateAuthUI();
    closeAuthModal();
    loadDriveFiles();

    // Actualizar nombre en WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomId: 'general',
        username: currentUser.username
      }));
    }
  } catch (err) {
    errBox.textContent = 'Error de conexión con el servidor.';
    errBox.classList.remove('hidden');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('papus_user');
  updateAuthUI();
  loadDriveFiles();
}

// ------------------------------------------
// 2. NAVEGACIÓN ENTRE TABS
// ------------------------------------------
function switchTab(tab) {
  currentTab = tab;
  const driveBtn = document.getElementById('tabDriveBtn');
  const cineBtn = document.getElementById('tabCineBtn');
  const driveSec = document.getElementById('sectionDrive');
  const cineSec = document.getElementById('sectionCine');

  if (tab === 'drive') {
    driveBtn.classList.add('active');
    cineBtn.classList.remove('active');
    driveSec.classList.add('active');
    cineSec.classList.remove('active');
  } else {
    cineBtn.classList.add('active');
    driveBtn.classList.remove('active');
    cineSec.classList.add('active');
    driveSec.classList.remove('active');
  }
}

// ------------------------------------------
// 3. PAPUSDRIVE — GESTIÓN DE ARCHIVOS
// ------------------------------------------
async function loadDriveFiles() {
  const grid = document.getElementById('filesGrid');
  try {
    const url = currentUser ? `/api/drive/files?userId=${currentUser.id}` : '/api/drive/files';
    const res = await fetch(url);
    const data = await res.json();
    allDriveFiles = data.files || [];
    renderFiles(allDriveFiles);
  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="icon-svg icon-xl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>No se pudo conectar con el disco D:.</p>
      </div>
    `;
  }
}

function renderFiles(files) {
  const grid = document.getElementById('filesGrid');
  if (!files || files.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="icon-svg icon-xl" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <p>No hay archivos en esta categoría. Sube el primero al disco D:.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = files.map(f => {
    const iconSvg = getFileIconSvg(f.original_name);
    const sizeStr = formatBytes(f.file_size);
    const dateStr = new Date(f.created_at).toLocaleDateString();
    const canDelete = currentUser && (currentUser.id === f.user_id || currentUser.role === 'admin');

    return `
      <div class="file-card">
        <div class="file-card-top">
          <div class="file-icon-svg-wrapper">${iconSvg}</div>
          <div class="file-meta">
            <h4 class="file-name" title="${escapeHtml(f.original_name)}">${escapeHtml(f.original_name)}</h4>
            <div class="file-sub">${sizeStr} • ${dateStr}</div>
          </div>
        </div>
        <div class="file-actions">
          <span class="file-owner-tag">${escapeHtml(f.owner || 'Papu')}</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="previewFile(${f.id}, '${escapeHtml(f.original_name)}', '${f.mime_type}')" title="Ver archivo">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <a href="/api/drive/download/${f.id}" class="btn btn-primary btn-sm" title="Descarga directa">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
            ${canDelete ? `
              <button class="btn btn-secondary btn-sm" onclick="deleteFile(${f.id})" style="color: var(--danger);" title="Eliminar">
                <svg class="icon-svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getFileIconSvg(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  }
  if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'iso'].includes(ext)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>`;
  }
  if (['exe', 'msi', 'bat', 'apk'].includes(ext)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`;
  }
  if (['pdf', 'txt', 'docx', 'xlsx', 'md'].includes(ext)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
  }
  return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Filtros y Búsqueda
function filterFiles() {
  const query = document.getElementById('driveSearch').value.toLowerCase().trim();
  let filtered = allDriveFiles;

  if (activeFilter === 'mine') {
    filtered = filtered.filter(f => currentUser && f.user_id === currentUser.id);
  } else if (activeFilter === 'public') {
    filtered = filtered.filter(f => f.is_public === 1);
  }

  if (query) {
    filtered = filtered.filter(f => f.original_name.toLowerCase().includes(query));
  }

  renderFiles(filtered);
}

function setFilter(filterType, btn) {
  activeFilter = filterType;
  document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  filterFiles();
}

// Subida de Archivos
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone');

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  });
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    uploadFile(file);
  }
}

function uploadFile(file) {
  if (!currentUser) {
    openAuthModal('login');
    alert('Debes iniciar sesión para subir archivos a PapusDrive.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', currentUser.id);
  formData.append('username', currentUser.username);
  formData.append('is_public', document.getElementById('publicToggle').checked ? '1' : '0');

  const progressBox = document.getElementById('uploadProgressBox');
  const progressBar = document.getElementById('uploadProgressBar');
  const fileNameText = document.getElementById('uploadingFileName');
  const percentageText = document.getElementById('uploadPercentage');

  progressBox.classList.remove('hidden');
  fileNameText.textContent = `Subiendo: ${file.name}`;
  progressBar.style.width = '0%';
  percentageText.textContent = '0%';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/drive/upload', true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = `${percent}%`;
      percentageText.textContent = `${percent}%`;
    }
  };

  xhr.onload = () => {
    setTimeout(() => progressBox.classList.add('hidden'), 1200);
    if (xhr.status === 200) {
      loadDriveFiles();
    } else {
      alert('Error al guardar el archivo en el disco D:.');
    }
  };

  xhr.onerror = () => {
    progressBox.classList.add('hidden');
    alert('Error de conexión durante la subida.');
  };

  xhr.send(formData);
}

async function deleteFile(id) {
  if (!confirm('¿Seguro que quieres borrar este archivo del disco D:?')) return;
  try {
    const res = await fetch(`/api/drive/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadDriveFiles();
    }
  } catch (err) {
    alert('Error al eliminar archivo.');
  }
}

// Previsualización
function previewFile(id, name, mime) {
  const modal = document.getElementById('previewModal');
  const title = document.getElementById('previewTitle');
  const content = document.getElementById('previewContent');
  title.textContent = name;

  const url = `/api/drive/preview/${id}`;
  const ext = name.split('.').pop().toLowerCase();

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    content.innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px; display: block; margin: 0 auto;">`;
  } else if (['mp4', 'webm', 'mov'].includes(ext)) {
    content.innerHTML = `<video src="${url}" controls autoplay style="width: 100%; border-radius: 8px;"></video>`;
  } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
    content.innerHTML = `<div style="text-align: center; padding: 2rem;"><audio src="${url}" controls autoplay style="width: 80%;"></audio></div>`;
  } else {
    content.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="margin-bottom: 1.5rem; color: var(--text-muted);">Este tipo de archivo se visualiza mejor descargándolo directamente.</p>
        <a href="/api/drive/download/${id}" class="btn btn-primary">
          <svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Descargar al instante
        </a>
      </div>
    `;
  }

  modal.classList.remove('hidden');
}

function closePreviewModal() {
  const modal = document.getElementById('previewModal');
  const content = document.getElementById('previewContent');
  content.innerHTML = '';
  modal.classList.add('hidden');
}

// ------------------------------------------
// 4. CINEPAPUS & WATCH PARTY (WEBSOCKETS)
// ------------------------------------------
const player = document.getElementById('cinePlayer');

function setupWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'JOIN_ROOM',
      roomId: 'general',
      username: currentUser ? currentUser.username : 'Papu'
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWsEvent(data);
    } catch (e) {}
  };

  ws.onclose = () => {
    setTimeout(setupWebSocket, 3000); // Reconexión automática
  };
}

function handleWsEvent(msg) {
  switch (msg.type) {
    case 'ROOM_SYNC':
      if (msg.mediaId && msg.mediaId !== currentMediaId) {
        loadMediaToPlayer(msg.mediaId, false);
      }
      if (msg.currentTime) {
        player.currentTime = msg.currentTime;
      }
      if (msg.isPlaying) {
        player.play().catch(() => {});
      }
      break;

    case 'MEDIA_LOADED':
      loadMediaToPlayer(msg.mediaId, false);
      appendChatMessage('system', `[CINE] ${msg.by} cargó una película a la sala.`);
      break;

    case 'PLAY':
      isRemoteSync = true;
      player.currentTime = msg.currentTime;
      player.play().finally(() => { isRemoteSync = false; });
      break;

    case 'PAUSE':
      isRemoteSync = true;
      player.currentTime = msg.currentTime;
      player.pause();
      isRemoteSync = false;
      break;

    case 'SEEK':
      isRemoteSync = true;
      player.currentTime = msg.currentTime;
      isRemoteSync = false;
      break;

    case 'CHAT_MESSAGE':
      appendChatMessage('user', msg.text, msg.username, msg.time);
      break;

    case 'USER_JOINED':
      document.getElementById('onlineCount').textContent = msg.onlineCount;
      appendChatMessage('system', `[SALA] ${msg.username} se unió a la sala.`);
      break;

    case 'USER_LEFT':
      document.getElementById('onlineCount').textContent = msg.onlineCount;
      appendChatMessage('system', `[SALA] ${msg.username} salió de la sala.`);
      break;
  }
}

// Event listeners del reproductor para emitir a la sala
player.addEventListener('play', () => {
  if (isRemoteSync) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'PLAY',
      currentTime: player.currentTime
    }));
  }
});

player.addEventListener('pause', () => {
  if (isRemoteSync) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'PAUSE',
      currentTime: player.currentTime
    }));
  }
});

player.addEventListener('seeked', () => {
  if (isRemoteSync) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'SEEK',
      currentTime: player.currentTime
    }));
  }
});

async function loadCineCatalog() {
  const grid = document.getElementById('moviesGrid');
  try {
    const res = await fetch('/api/cine/catalog');
    const data = await res.json();
    const catalog = data.catalog || [];
    document.getElementById('catalogCount').textContent = `${catalog.length} títulos`;

    if (catalog.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
          <p>No hay videos en la cartelera todavía. Puedes subir uno o escanear la carpeta <code>D:\\PapusCloud\\cine</code>.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = catalog.map(m => `
      <div class="movie-card" onclick="selectMovie(${m.id}, '${escapeHtml(m.title)}')">
        <div class="movie-thumb-netflix">
          <svg class="netflix-icon-svg" style="width: 24px; height: 38px;" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H7.5V36H0V0Z" fill="#B81D24"/>
            <path d="M16.5 0H24V36H16.5V0Z" fill="#B81D24"/>
            <path d="M0 0H7.5L24 36H16.5L0 0Z" fill="#E50914"/>
          </svg>
        </div>
        <div class="movie-info">
          <h4 class="movie-title">${escapeHtml(m.title)}</h4>
          <span class="movie-badge" style="color: #E50914; font-weight: 700;">${escapeHtml(m.category || 'Películas')}</span>
        </div>
      </div>
    `).join('');

  } catch (err) {
    grid.innerHTML = '<p>Error al cargar la cartelera de CinePapus.</p>';
  }
}

function selectMovie(mediaId, title) {
  loadMediaToPlayer(mediaId, true);
}

function loadMediaToPlayer(mediaId, broadcast = true) {
  currentMediaId = mediaId;
  player.src = `/api/cine/stream/${mediaId}`;
  document.getElementById('nowPlayingTitle').textContent = `Reproduciendo ahora`;

  if (broadcast && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'LOAD_MEDIA',
      mediaId
    }));
  }

  player.play().catch(() => {});
}

async function scanCineFolder() {
  try {
    const res = await fetch('/api/cine/scan', { method: 'POST' });
    const data = await res.json();
    alert(`Escaneo completado: ${data.added} películas/videos nuevos indexados desde el disco D:.`);
    loadCineCatalog();
  } catch (err) {
    alert('Error al escanear carpeta en D:.');
  }
}

// Chat de la Watch Party
function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      text
    }));
  }
  input.value = '';
}

function appendChatMessage(type, text, user = '', time = '') {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');

  if (type === 'system') {
    div.className = 'chat-msg system';
    div.innerHTML = `<p>${escapeHtml(text)}</p>`;
  } else {
    div.className = 'chat-msg';
    div.innerHTML = `
      <div class="chat-msg-header">
        <span class="chat-msg-user">${escapeHtml(user)}</span>
        <span class="chat-msg-time">${time}</span>
      </div>
      <p>${escapeHtml(text)}</p>
    `;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Modal subir película
function openUploadMovieModal() {
  document.getElementById('movieUploadModal').classList.remove('hidden');
}

function closeMovieUploadModal() {
  document.getElementById('movieUploadModal').classList.add('hidden');
}

function handleMovieUpload(e) {
  e.preventDefault();
  const title = document.getElementById('movieTitle').value;
  const category = document.getElementById('movieCategory').value;
  const fileInput = document.getElementById('movieFile');
  const file = fileInput.files[0];

  if (!file) return;

  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', title);
  formData.append('category', category);

  const progressBox = document.getElementById('movieUploadProgress');
  const progressBar = document.getElementById('movieProgressBar');
  const submitBtn = document.getElementById('btnSubmitMovie');

  progressBox.classList.remove('hidden');
  submitBtn.disabled = true;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/cine/upload', true);

  xhr.upload.onprogress = (ev) => {
    if (ev.lengthComputable) {
      const pct = Math.round((ev.loaded / ev.total) * 100);
      progressBar.style.width = `${pct}%`;
    }
  };

  xhr.onload = () => {
    submitBtn.disabled = false;
    closeMovieUploadModal();
    progressBox.classList.add('hidden');
    if (xhr.status === 200) {
      loadCineCatalog();
    } else {
      alert('Error al subir video.');
    }
  };

  xhr.send(formData);
}
