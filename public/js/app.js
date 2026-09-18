// ==========================================
// PAPUSCLOUD — LOGICA INTEGRAL (DRIVE & CINEPAPUS)
// ==========================================

let currentUser = null;
let currentTab = 'cine';
let allDriveFiles = [];
let cineRecommendations = [];
let activeFilter = 'mine'; // 'mine' | 'public' | 'all'
let currentMedia = null;
let activeServer = 1;
let currentSeason = 1;
let currentEpisode = 1;
let ws = null;
let isBackendConnected = false;

// Catálogo curado de recomendaciones estilo Netflix con IDs reales de IMDB
const DEFAULT_RECOMMENDATIONS = [
  {
    id: "rec_mushoku",
    imdbId: "tt13293588",
    title: "Mushoku Tensei: Jobless Reincarnation",
    year: 2021,
    type: "series",
    rating: 8.4,
    genre: "Anime / Fantasía / Isekai",
    poster: "https://m.media-amazon.com/images/M/MV5BYWQwNjk3MDItNDAxMS00YTQ2LWEyNDctMGYyZTE5OGQxNGQ1XkEyXkFqcGc@._V1_SX250.jpg",
    desc: "Un hombre reencarna en un mundo mágico como Rudeus Greyrat, decidido a vivir su nueva vida al máximo y dominar la magia."
  },
  {
    id: "rec_rezero",
    imdbId: "tt5607616",
    title: "Re: Zero - Starting Life in Another World",
    year: 2016,
    type: "series",
    rating: 8.2,
    genre: "Anime / Drama / Fantasía",
    poster: "https://m.media-amazon.com/images/M/MV5BNDlmM2M2ZTgtN2RkYi00Nzk1LThkNTQtNzBjMGVjNWIwYjM4XkEyXkFqcGc@._V1_SX250.jpg",
    desc: "Subaru Natsuki es transportado a un mundo desconocido donde descubre que tiene el misterioso poder de regresar de la muerte."
  },
  {
    id: "rec_demonslayer",
    imdbId: "tt9335498",
    title: "Demon Slayer: Kimetsu no Yaiba",
    year: 2019,
    type: "series",
    rating: 8.7,
    genre: "Anime / Acción / Shonen",
    poster: "https://m.media-amazon.com/images/M/MV5BNmU4M2FjNWQtNmE4My05NzM1LTg5NGEtOTkwMDlhMWIzNGM0XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    desc: "Tanjiro Kamado emprende un viaje para vengar a su familia y salvar a su hermana Nezuko, convertida en demonio."
  },
  {
    id: "rec_attackontitan",
    imdbId: "tt2560140",
    title: "Attack on Titan (Shingeki no Kyojin)",
    year: 2013,
    type: "series",
    rating: 9.1,
    genre: "Anime / Acción / Misterio",
    poster: "https://m.media-amazon.com/images/M/MV5BNTIwMjE2Mjc1MF5BMl5BanBnXkFtZTcwNzQxNDQ3Mw@@._V1_FMjpg_UX1000_.jpg",
    desc: "Tras la destrucción de su ciudad natal a manos de gigantescos Titanes, Eren Jaeger jura limpiar la faz de la tierra de ellos."
  },
  {
    id: "rec_spiderman",
    imdbId: "tt9362722",
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    type: "movie",
    rating: 8.6,
    genre: "Animación / Acción",
    poster: "https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    desc: "Miles Morales es catapultado a través del Multiverso, donde se encuentra con un equipo de Spider-People encargados de proteger su existencia."
  },
  {
    id: "rec_interstellar",
    imdbId: "tt0816692",
    title: "Interestelar",
    year: 2014,
    type: "movie",
    rating: 8.7,
    genre: "Ciencia Ficción / Aventura",
    poster: "https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    desc: "Un grupo de exploradores hace uso de un agujero de gusano recién descubierto para superar las limitaciones de los viajes espaciales humanos."
  },
  {
    id: "rec_inception",
    imdbId: "tt1375666",
    title: "El Origen (Inception)",
    year: 2010,
    type: "movie",
    rating: 8.8,
    genre: "Acción / Sci-Fi",
    poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg",
    desc: "A un ladrón que roba secretos corporativos mediante la tecnología de sueños compartidos se le asigna la tarea inversa de plantar una idea en la mente de un director general."
  },
  {
    id: "rec_darkknight",
    imdbId: "tt0468569",
    title: "Batman: El Caballero de la Noche",
    year: 2008,
    type: "movie",
    rating: 9.0,
    genre: "Acción / Crimen",
    poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
    desc: "Cuando la amenaza conocida como El Guasón causa estragos y el caos en la gente de Gotham, Batman debe aceptar una de las mayores pruebas psicológicas y físicas."
  },
  {
    id: "rec_breakingbad",
    imdbId: "tt0903747",
    title: "Breaking Bad",
    year: 2008,
    type: "series",
    rating: 9.5,
    genre: "Serie TV / Drama / Crimen",
    poster: "https://m.media-amazon.com/images/M/MV5BMDEzMmQwZjctZWU2My00MWNlLWE0NjItMDJlYTRlNGJiZjcyXkEyXkFqcGc@._V1_.jpg",
    desc: "Un profesor de química diagnosticado con cáncer inoperable de pulmón recurre a la fabricación y venta de metanfetamina con su antiguo alumno para asegurar el futuro de su familia."
  },
  {
    id: "rec_strangerthings",
    imdbId: "tt4574334",
    title: "Stranger Things",
    year: 2016,
    type: "series",
    rating: 8.7,
    genre: "Serie TV / Fantasía / Horror",
    poster: "https://m.media-amazon.com/images/M/MV5BMjg1OTc4MDktMmM2Ny00YmY0LWEyYmQtZTI3MzYyMmE2ZDYwXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    desc: "Cuando un niño desaparece, sus amigos, la familia y la policía local se ven envueltos en un enigma extraordinario que involucra experimentos secretos y fuerzas sobrenaturales."
  },
  {
    id: "rec_elcamino",
    imdbId: "tt9243946",
    title: "El Camino: A Breaking Bad Movie",
    year: 2019,
    type: "movie",
    rating: 7.3,
    genre: "Drama / Crimen",
    poster: "https://m.media-amazon.com/images/M/MV5BNjk4MzVlM2UtZGM0ZC00M2M1LThkMWEtZjUyN2U2ZTc0NmM5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    desc: "Jesse Pinkman huye de sus captores, de la ley y de su pasado tras escapar de su cautiverio."
  },
  {
    id: "rec_shrek2",
    imdbId: "tt0298148",
    title: "Shrek 2",
    year: 2004,
    type: "movie",
    rating: 7.3,
    genre: "Animación / Comedia",
    poster: "https://m.media-amazon.com/images/M/MV5BMDJhMGRjN2QtNDUxYy00NGM3LThjNGQtNDlhZGFjZGMxZTViXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    desc: "Shrek y Fiona viajan al Reino de Muy Muy Lejano para que los padres de Fiona celebren su matrimonio, pero las cosas no salen como esperaban."
  }
];

// ------------------------------------------
// INICIALIZACIÓN
// ------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  initEpisodeDropdown(1, 50);
  initAuth();
  await checkBackendStatus();
  loadStats();
  loadDriveFiles();
  loadCineRecommendations();
  loadCineCatalog();
  renderMyWatchlist();
  setupDragAndDrop();
  setupWebSocket();

  // Búsqueda en vivo al escribir en el buscador de cine
  const cineInput = document.getElementById('cineSearchInput');
  if (cineInput) {
    cineInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      const val = e.target.value.trim();
      if (val.length >= 2) {
        searchDebounceTimer = setTimeout(() => handleCineSearch(), 500);
      }
    });
  }

  // Autocargar primera recomendación por defecto
  if (DEFAULT_RECOMMENDATIONS.length > 0) {
    selectMovie(DEFAULT_RECOMMENDATIONS[0], false);
  }
});

// Comprobar si el backend de Node.js está disponible en el puerto 4500
async function checkBackendStatus() {
  const modeBadge = document.getElementById('modeBadge');
  try {
    const res = await fetch('/api/stats', { signal: AbortSignal.timeout(1800) });
    if (res.ok) {
      isBackendConnected = true;
      if (modeBadge) {
        modeBadge.textContent = "Disco D: Conectado";
        modeBadge.style.background = "rgba(16, 185, 129, 0.2)";
        modeBadge.style.color = "#34d399";
      }
      return;
    }
  } catch (e) {
    // Si corre en GitHub Pages o modo estático
    isBackendConnected = false;
  }

  if (modeBadge) {
    modeBadge.textContent = "Modo Web Online";
    modeBadge.style.background = "rgba(99, 102, 241, 0.2)";
    modeBadge.style.color = "#818cf8";
  }
}

// ------------------------------------------
// 1. SISTEMA DE CUENTAS INDEPENDIENTES
// ------------------------------------------
function initAuth() {
  const saved = localStorage.getItem('papus_current_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch (e) {
      currentUser = null;
    }
  }

  if (!currentUser) {
    // Cuenta por defecto si no ha iniciado sesión
    currentUser = { id: 1, username: 'InvitadoPapu', role: 'papu' };
  }

  updateAuthUI();
}

function updateAuthUI() {
  const unlogged = document.getElementById('unloggedView');
  const logged = document.getElementById('loggedView');
  const userText = document.getElementById('usernameText');
  const avatarLetter = document.getElementById('userAvatarLetter');
  const userBadge = document.getElementById('watchlistUserBadge');

  if (currentUser && currentUser.username !== 'InvitadoPapu') {
    unlogged.classList.add('hidden');
    logged.classList.remove('hidden');
    userText.textContent = currentUser.username;
    if (avatarLetter) {
      avatarLetter.textContent = currentUser.username.charAt(0).toUpperCase();
    }
    if (userBadge) {
      userBadge.textContent = currentUser.username;
    }
  } else {
    unlogged.classList.remove('hidden');
    logged.classList.add('hidden');
    if (userBadge) {
      userBadge.textContent = "Invitado";
    }
  }

  // Actualizar filtros y vistas de Drive y Cine para este usuario
  renderMyWatchlist();
  if (currentTab === 'drive') {
    filterFiles();
  }
}

let authMode = 'login'; // 'login' | 'register'

function openAuthModal(mode = 'login') {
  authMode = mode;
  document.getElementById('authModalTitle').textContent = mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Papu';
  document.getElementById('authSubmitBtn').textContent = mode === 'login' ? 'Entrar a Mi Cuenta' : 'Crear Cuenta y Entrar';
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
  const username = document.getElementById('authUsername').value.trim().toLowerCase();
  const password = document.getElementById('authPassword').value;
  const errBox = document.getElementById('authErrorMsg');

  if (!username || !password) {
    errBox.textContent = 'Por favor completa todos los campos.';
    errBox.classList.remove('hidden');
    return;
  }

  // Si hay backend conectado, autenticar con el servidor de Node
  if (isBackendConnected) {
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
      localStorage.setItem('papus_current_user', JSON.stringify(currentUser));
      closeAuthModal();
      updateAuthUI();
      loadDriveFiles();
      return;
    } catch (err) {
      console.warn('Fallo backend local, usando almacenamiento cliente', err);
    }
  }

  // Modo Web (GitHub Pages / Standalone en navegador)
  let accounts = [];
  try {
    accounts = JSON.parse(localStorage.getItem('papus_web_accounts') || '[]');
  } catch (err) {
    accounts = [];
  }

  if (authMode === 'register') {
    const exists = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      errBox.textContent = 'Ese nombre de usuario ya existe. Inicia sesión.';
      errBox.classList.remove('hidden');
      return;
    }
    const newUser = { id: Date.now(), username, password, role: accounts.length === 0 ? 'admin' : 'papu' };
    accounts.push(newUser);
    localStorage.setItem('papus_web_accounts', JSON.stringify(accounts));
    currentUser = { id: newUser.id, username: newUser.username, role: newUser.role };
  } else {
    const found = accounts.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === password);
    if (!found) {
      // Si la lista está vacía y es la primera vez, autoconceder acceso
      if (accounts.length === 0) {
        const newUser = { id: Date.now(), username, password, role: 'admin' };
        accounts.push(newUser);
        localStorage.setItem('papus_web_accounts', JSON.stringify(accounts));
        currentUser = { id: newUser.id, username: newUser.username, role: newUser.role };
      } else {
        errBox.textContent = 'Usuario o contraseña incorrectos.';
        errBox.classList.remove('hidden');
        return;
      }
    } else {
      currentUser = { id: found.id, username: found.username, role: found.role };
    }
  }

  localStorage.setItem('papus_current_user', JSON.stringify(currentUser));
  closeAuthModal();
  updateAuthUI();
  loadDriveFiles();
}

function logout() {
  currentUser = { id: 1, username: 'InvitadoPapu', role: 'papu' };
  localStorage.removeItem('papus_current_user');
  updateAuthUI();
  loadDriveFiles();
}

// ------------------------------------------
// 2. BUSCADOR DE PELÍCULAS Y SERIES ("COMO SEEKE")
// ------------------------------------------
let searchDebounceTimer = null;

async function handleCineSearch(e) {
  if (e) e.preventDefault();
  const rawQuery = document.getElementById('cineSearchInput')?.value?.trim();
  if (!rawQuery) return;

  const resultsSection = document.getElementById('searchResultsSection');
  const resultsGrid = document.getElementById('searchResultsGrid');
  const resultsCount = document.getElementById('searchResultsCount');

  resultsSection.classList.remove('hidden');
  resultsGrid.innerHTML = `
    <div class="empty-state-mini">
      <p>🔍 Buscando "<strong>${escapeHtml(rawQuery)}</strong>" en el catálogo mundial de anime, series y películas...</p>
    </div>
  `;

  try {
    const encoded = encodeURIComponent(rawQuery);
    
    // Consulta concurrente a catálogo Cinemeta para series/anime y películas (CORS habilitado 100%)
    const [seriesFetch, moviesFetch] = await Promise.allSettled([
      fetch(`https://v3-cinemeta.strem.io/catalog/series/top/search=${encoded}.json`).then(r => r.ok ? r.json() : { metas: [] }),
      fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encoded}.json`).then(r => r.ok ? r.json() : { metas: [] })
    ]);

    const seriesMetas = (seriesFetch.status === 'fulfilled' && seriesFetch.value?.metas) ? seriesFetch.value.metas : [];
    const moviesMetas = (moviesFetch.status === 'fulfilled' && moviesFetch.value?.metas) ? moviesFetch.value.metas : [];

    // Priorizar series/anime si la búsqueda contiene palabras clave comunes de anime o si hay coincidencias de serie
    const qLower = rawQuery.toLowerCase();
    const isAnimeOrSeries = qLower.includes('tensei') || qLower.includes('zero') || qLower.includes('anime') || 
                            qLower.includes('shonen') || qLower.includes('kyojin') || qLower.includes('yaiba') || 
                            qLower.includes('piece') || qLower.includes('ball') || qLower.includes('naruto') ||
                            qLower.includes('season') || qLower.includes('serie') || seriesMetas.length > 0;

    const combined = isAnimeOrSeries ? [...seriesMetas, ...moviesMetas] : [...moviesMetas, ...seriesMetas];

    // Deduplicar y formatear
    const seen = new Set();
    const validTitles = [];

    for (const item of combined) {
      const id = item.imdb_id || item.id;
      if (!id || seen.has(id)) continue;
      // Descartar videos irrelevantes o duplicados técnicos
      if (item.name?.includes('#DUPE#') || item.name?.toLowerCase().includes('reaction video')) continue;
      seen.add(id);

      const isSeries = item.type === 'series' || item.type === 'tvSeries';
      const posterUrl = (item.poster && !item.poster.includes('null')) 
        ? item.poster 
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
      const year = item.releaseInfo || item.year || (isSeries ? 'Serie' : 'Película');
      const isAnime = (Array.isArray(item.genres) && item.genres.some(g => g.toLowerCase().includes('animation') || g.toLowerCase().includes('anime'))) ||
                      item.name?.toLowerCase().includes('tensei') || item.name?.toLowerCase().includes('zero') ||
                      item.name?.toLowerCase().includes('yaiba') || item.name?.toLowerCase().includes('kyojin');

      const badgeLabel = isAnime ? 'Anime HD' : (isSeries ? 'Serie TV' : 'Película');

      validTitles.push({
        id: 'imdb_' + id,
        imdbId: id,
        title: item.name,
        year: year,
        type: isSeries ? 'series' : 'movie',
        isAnime: isAnime,
        badgeLabel: badgeLabel,
        rating: item.imdbRating || 8.2,
        genre: Array.isArray(item.genres) && item.genres.length > 0 ? item.genres.join(' / ') : badgeLabel,
        poster: posterUrl,
        desc: item.description || `Disponible en streaming con opciones de doblaje al español y subtítulos.`
      });
    }

    if (validTitles.length === 0) {
      resultsGrid.innerHTML = `
        <div class="empty-state-mini">
          <p>No se encontraron resultados para "<strong>${escapeHtml(rawQuery)}</strong>". Intenta escribir el nombre sin signos raros (ej: <em>Mushoku Tensei, Re Zero, Kimetsu no Yaiba, Attack on Titan, Solo Leveling</em>).</p>
        </div>
      `;
      resultsCount.textContent = "0 encontrados";
      return;
    }

    resultsCount.textContent = `${validTitles.length} títulos encontrados`;
    resultsGrid.innerHTML = validTitles.map(movie => {
      const isSeries = movie.type === 'series';
      const movieJsonEscaped = JSON.stringify(movie).replace(/"/g, '&quot;');

      return `
        <div class="movie-card" onclick="selectMovie(${movieJsonEscaped})">
          <div class="movie-poster-box">
            <span class="badge-type ${isSeries ? 'series' : ''}">${escapeHtml(movie.badgeLabel || (isSeries ? 'Serie' : 'Película'))}</span>
            <img class="movie-poster-img" src="${escapeHtml(movie.poster)}" alt="${escapeHtml(movie.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'">
            <div class="movie-hover-overlay">
              <button class="btn btn-netflix btn-sm">
                <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Ver Ahora
              </button>
            </div>
          </div>
          <div class="movie-info">
            <h4 class="movie-title">${escapeHtml(movie.title)}</h4>
            <div class="movie-meta-row">
              <span class="movie-year">${escapeHtml(String(movie.year))}</span>
              <span class="movie-rating-badge">${isSeries ? 'HD Serie' : 'Full HD'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error buscando películas y anime:', err);
    resultsGrid.innerHTML = `
      <div class="empty-state-mini">
        <p>Hubo un problema de conexión al buscar. Por favor prueba de nuevo.</p>
      </div>
    `;
  }
}

// ------------------------------------------
// 3. REPRODUCTOR DE STREAMING MULTI-SERVIDOR
// ------------------------------------------
function initEpisodeDropdown(season, totalEpisodes = 50) {
  const epSelect = document.getElementById('episodeSelect');
  if (!epSelect) return;
  epSelect.innerHTML = '';
  for (let i = 1; i <= totalEpisodes; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Episodio ${i}`;
    epSelect.appendChild(opt);
  }
}

let currentLanguage = 'latino'; // 'latino' | 'castellano' | 'sub'

function switchLanguage(lang) {
  currentLanguage = lang;
  const btns = document.querySelectorAll('.btn-lang');
  btns.forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick')?.includes(lang));
  });

  const hintText = document.querySelector('#audioHintBar span');
  if (hintText) {
    if (lang === 'latino') {
      hintText.innerHTML = '<strong>Modo Español Latino:</strong> Priorizado en Servidor 1 (Latino HD) y Servidor 2 (VidLink). Si la reproducción inicia en inglés o japonés, pulsa el botón de <strong>Audio / Pista (🔈)</strong> o <strong>Ajustes (⚙️)</strong> dentro del reproductor para cambiar la pista a <strong>Español Latino</strong>.';
    } else if (lang === 'castellano') {
      hintText.innerHTML = '<strong>Modo Castellano:</strong> En el reproductor, haz clic en el icono de <strong>Audio (🔈)</strong> o Ajustes y selecciona la pista <strong>Español (España)</strong>.';
    } else {
      hintText.innerHTML = '<strong>Modo Subtitulado:</strong> Idioma original con subtítulos en Español activables en el reproductor.';
    }
  }

  // Si no está en servidor 1 o 2, cambiar a servidor 1 para mejor compatibilidad en español
  if (activeServer !== 1 && activeServer !== 2) {
    switchServer(1);
  } else {
    reloadPlayer();
  }
}

let currentSeriesVideos = []; // Almacena todos los episodios reales de la serie actual

async function loadSeriesMetadata(imdbId) {
  const seasonSelect = document.getElementById('seasonSelect');
  const episodeSelect = document.getElementById('episodeSelect');
  if (!seasonSelect || !episodeSelect) return;

  seasonSelect.innerHTML = '<option value="1">Cargando temporadas...</option>';
  episodeSelect.innerHTML = '<option value="1">Cargando episodios...</option>';

  try {
    const res = await fetch(`https://v3-cinemeta.strem.io/meta/series/${imdbId}.json`);
    if (!res.ok) throw new Error('Error al cargar temporadas');
    const data = await res.json();
    const videos = data.meta?.videos || [];

    // Filtrar episodios válidos de temporadas (season > 0)
    currentSeriesVideos = videos.filter(v => v.season && v.season > 0);

    if (currentSeriesVideos.length === 0) {
      fallbackSeasonsAndEpisodes();
      return;
    }

    // Obtener temporadas únicas reales ordenadas (ej. 1, 2, 3)
    const seasons = Array.from(new Set(currentSeriesVideos.map(v => v.season))).sort((a, b) => a - b);

    seasonSelect.innerHTML = seasons.map(s => `
      <option value="${s}" ${s === currentSeason ? 'selected' : ''}>Temporada ${s}</option>
    `).join('');

    if (!seasons.includes(currentSeason)) {
      currentSeason = seasons[0] || 1;
      seasonSelect.value = String(currentSeason);
    }

    // Poblar episodios reales con sus títulos para la temporada seleccionada
    updateEpisodesForSeason(currentSeason);

  } catch (err) {
    console.warn('Error cargando metadata de la serie:', err);
    fallbackSeasonsAndEpisodes();
  }
}

function updateEpisodesForSeason(seasonNum) {
  const episodeSelect = document.getElementById('episodeSelect');
  if (!episodeSelect) return;

  const seasonEps = currentSeriesVideos
    .filter(v => v.season === seasonNum)
    .sort((a, b) => (a.number || a.episode) - (b.number || b.episode));

  if (seasonEps.length === 0) {
    initEpisodeDropdown(seasonNum, 24);
    return;
  }

  episodeSelect.innerHTML = seasonEps.map(v => {
    const num = v.number || v.episode;
    const epTitle = (v.name || v.title) ? ` — ${v.name || v.title}` : '';
    return `<option value="${num}" ${num === currentEpisode ? 'selected' : ''}>Episodio ${num}${escapeHtml(epTitle)}</option>`;
  }).join('');

  const hasCurrent = seasonEps.some(v => (v.number || v.episode) === currentEpisode);
  if (!hasCurrent && seasonEps.length > 0) {
    currentEpisode = seasonEps[0].number || seasonEps[0].episode || 1;
    episodeSelect.value = String(currentEpisode);
  }
}

function fallbackSeasonsAndEpisodes() {
  const seasonSelect = document.getElementById('seasonSelect');
  if (seasonSelect) {
    seasonSelect.innerHTML = `
      <option value="1" selected>Temporada 1</option>
      <option value="2">Temporada 2</option>
      <option value="3">Temporada 3</option>
    `;
  }
  initEpisodeDropdown(1, 24);
}

function getEmbedUrl(imdbId, type, season = 1, episode = 1, server = 1) {
  const isSeries = type === 'series' || type === 'tvSeries';
  const langParam = (currentLanguage === 'latino' || currentLanguage === 'castellano') ? '&ds_lang=es' : '';

  switch (server) {
    case 1:
      // MultiEmbed: Servidor líder con pestañas internas para Español Latino y Castellano
      return isSeries
        ? `https://multiembed.mov/?video_id=${imdbId}&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${imdbId}`;
    case 2:
      // VidLink: Reproductor interactivo con selector de audio (Español Latino) y subtítulos
      return isSeries
        ? `https://vidlink.pro/tv/${imdbId}/${season}/${episode}?primaryColor=E50914`
        : `https://vidlink.pro/movie/${imdbId}?primaryColor=E50914`;
    case 3:
      // Embed.su: Servidor ultra rápido con pistas de audio multi-idioma
      return isSeries
        ? `https://embed.su/embed/tv/${imdbId}/${season}/${episode}`
        : `https://embed.su/embed/movie/${imdbId}`;
    case 4:
      // VidSrc CC: Servidor con pistas de doblaje y subtítulos
      return isSeries
        ? `https://vidsrc.cc/v2/embed/tv/${imdbId}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/movie/${imdbId}`;
    case 5:
    default:
      // AutoEmbed: Servidor alternativo
      return isSeries
        ? `https://player.autoembed.cc/embed/tv/${imdbId}/${season}/${episode}`
        : `https://player.autoembed.cc/embed/movie/${imdbId}`;
  }
}

function selectMovie(movie, scroll = true) {
  currentMedia = movie;
  currentSeason = 1;
  currentEpisode = 1;

  const nowPlayingTitle = document.getElementById('nowPlayingTitle');
  const nowPlayingDesc = document.getElementById('nowPlayingDesc');
  const embedPlayer = document.getElementById('cineEmbedPlayer');
  const localPlayer = document.getElementById('cineLocalPlayer');
  const tvControls = document.getElementById('tvSeriesControls');

  nowPlayingTitle.textContent = movie.title + (movie.year ? ` (${movie.year})` : '');
  nowPlayingDesc.textContent = movie.desc || (movie.genre ? `${movie.genre} — Streaming en alta calidad` : 'Reproduciendo en CinePapus');

  const isSeries = movie.type === 'series' || movie.type === 'tvSeries';

  if (isSeries) {
    tvControls.classList.remove('hidden');
    // Cargar temporadas y episodios REALES desde el catálogo mundial
    loadSeriesMetadata(movie.imdbId);
  } else {
    tvControls.classList.add('hidden');
    currentSeriesVideos = [];
  }

  // Si es un archivo local del disco D:
  if (movie.isLocal && movie.localUrl) {
    embedPlayer.classList.add('hidden');
    embedPlayer.src = '';
    localPlayer.classList.remove('hidden');
    localPlayer.src = movie.localUrl;
    localPlayer.play().catch(() => {});
  } else {
    // Es streaming online (IMDB / Recomendación / Búsqueda)
    localPlayer.classList.add('hidden');
    localPlayer.pause();
    localPlayer.src = '';
    embedPlayer.classList.remove('hidden');

    const streamUrl = getEmbedUrl(movie.imdbId, movie.type, currentSeason, currentEpisode, activeServer);
    embedPlayer.src = streamUrl;
  }

  // Guardar en historial del usuario y actualizar botón de watchlist
  updateWatchlistButtonState();
  addToUserHistory(movie);

  // Sincronizar con la sala por WebSockets si está disponible
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'LOAD_MEDIA',
      mediaId: movie.id,
      title: movie.title,
      imdbId: movie.imdbId,
      mediaType: movie.type,
      sender: currentUser?.username || 'Papu'
    }));
  }

  if (scroll) {
    document.getElementById('playerContainerCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function switchServer(serverNum) {
  activeServer = serverNum;
  const buttons = document.querySelectorAll('.btn-server');
  buttons.forEach((btn, idx) => {
    btn.classList.toggle('active', idx + 1 === serverNum);
  });

  if (!currentMedia || currentMedia.isLocal) return;

  const embedPlayer = document.getElementById('cineEmbedPlayer');
  const streamUrl = getEmbedUrl(currentMedia.imdbId, currentMedia.type, currentSeason, currentEpisode, activeServer);
  embedPlayer.src = streamUrl;
}

function onSeasonChange(seasonVal) {
  currentSeason = parseInt(seasonVal, 10) || 1;
  currentEpisode = 1;
  if (currentSeriesVideos && currentSeriesVideos.length > 0) {
    updateEpisodesForSeason(currentSeason);
  } else {
    initEpisodeDropdown(currentSeason, 24);
  }
  const epSelect = document.getElementById('episodeSelect');
  if (epSelect) epSelect.value = "1";
  reloadPlayer();
}

function onEpisodeChange(episodeVal) {
  currentEpisode = parseInt(episodeVal, 10) || 1;
  reloadPlayer();
}

function nextEpisode() {
  const seasonEps = currentSeriesVideos.filter(v => v.season === currentSeason);
  const maxEp = seasonEps.length > 0 
    ? Math.max(...seasonEps.map(v => v.number || v.episode)) 
    : 24;

  if (currentEpisode < maxEp) {
    currentEpisode += 1;
    const epSelect = document.getElementById('episodeSelect');
    if (epSelect) epSelect.value = String(currentEpisode);
    reloadPlayer();
  } else {
    // Si terminó la temporada, verificar si hay siguiente temporada
    const seasons = Array.from(new Set(currentSeriesVideos.map(v => v.season))).sort((a, b) => a - b);
    const nextSeasonIdx = seasons.indexOf(currentSeason) + 1;
    if (nextSeasonIdx < seasons.length) {
      currentSeason = seasons[nextSeasonIdx];
      const seasonSelect = document.getElementById('seasonSelect');
      if (seasonSelect) seasonSelect.value = String(currentSeason);
      onSeasonChange(currentSeason);
    }
  }
}

function prevEpisode() {
  if (currentEpisode > 1) {
    currentEpisode -= 1;
    const epSelect = document.getElementById('episodeSelect');
    if (epSelect) epSelect.value = String(currentEpisode);
    reloadPlayer();
  }
}

function reloadPlayer() {
  if (!currentMedia) return;
  const embedPlayer = document.getElementById('cineEmbedPlayer');
  if (!currentMedia.isLocal) {
    const streamUrl = getEmbedUrl(currentMedia.imdbId, currentMedia.type, currentSeason, currentEpisode, activeServer);
    embedPlayer.src = streamUrl;
  } else {
    const localPlayer = document.getElementById('cineLocalPlayer');
    localPlayer.load();
    localPlayer.play().catch(() => {});
  }
}

// ------------------------------------------
// 4. GESTIÓN DE LISTA PERSONAL (POR CUENTA)
// ------------------------------------------
function getUserWatchlistKey() {
  const username = currentUser?.username || 'invitado';
  return `papus_watchlist_${username.toLowerCase()}`;
}

function getUserWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(getUserWatchlistKey()) || '[]');
  } catch (e) {
    return [];
  }
}

function toggleCurrentWatchlist() {
  if (!currentMedia) return;
  const list = getUserWatchlist();
  const index = list.findIndex(m => m.id === currentMedia.id || (m.imdbId && m.imdbId === currentMedia.imdbId));

  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.unshift(currentMedia);
  }

  localStorage.setItem(getUserWatchlistKey(), JSON.stringify(list));
  updateWatchlistButtonState();
  renderMyWatchlist();
}

function updateWatchlistButtonState() {
  const btnText = document.getElementById('watchlistBtnText');
  if (!btnText || !currentMedia) return;
  const list = getUserWatchlist();
  const exists = list.some(m => m.id === currentMedia.id || (m.imdbId && m.imdbId === currentMedia.imdbId));
  btnText.textContent = exists ? "En Mi Lista (Quitar)" : "Guardar en Mi Lista";
}

function renderMyWatchlist() {
  const grid = document.getElementById('myWatchlistGrid');
  const countEl = document.getElementById('myWatchlistCount');
  if (!grid) return;

  const list = getUserWatchlist();
  if (countEl) countEl.textContent = `${list.length} títulos`;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state-mini">
        <p>Tu lista personal de películas y series está vacía. Usa el buscador arriba para agregar las que quieras ver.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(movie => {
    const isSeries = movie.type === 'series' || movie.type === 'tvSeries';
    const movieJson = JSON.stringify(movie).replace(/"/g, '&quot;');
    return `
      <div class="movie-card" onclick="selectMovie(${movieJson})">
        <div class="movie-poster-box">
          <span class="badge-type ${isSeries ? 'series' : ''}">${isSeries ? 'Serie TV' : 'Película'}</span>
          <img class="movie-poster-img" src="${escapeHtml(movie.poster || '')}" alt="${escapeHtml(movie.title)}" loading="lazy">
          <div class="movie-hover-overlay">
            <button class="btn btn-netflix btn-sm">
              <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Ver Ahora
            </button>
          </div>
        </div>
        <div class="movie-info">
          <h4 class="movie-title">${escapeHtml(movie.title)}</h4>
          <div class="movie-meta-row">
            <span class="movie-year">${escapeHtml(String(movie.year || ''))}</span>
            <span class="movie-rating-badge">${isSeries ? 'HD Serie' : 'Full HD'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function addToUserHistory(movie) {
  const username = currentUser?.username || 'invitado';
  const historyKey = `papus_history_${username.toLowerCase()}`;
  try {
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history = history.filter(h => h.id !== movie.id);
    history.unshift({
      ...movie,
      lastWatched: Date.now(),
      season: currentSeason,
      episode: currentEpisode
    });
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
  } catch (e) {}
}

// ------------------------------------------
// 5. RECOMENDACIONES DE CINE ESTILO NETFLIX
// ------------------------------------------
function loadCineRecommendations() {
  cineRecommendations = DEFAULT_RECOMMENDATIONS;
  const grid = document.getElementById('recommendedGrid');
  const countEl = document.getElementById('recCount');

  if (countEl) countEl.textContent = `${cineRecommendations.length} títulos`;
  if (!grid) return;

  grid.innerHTML = cineRecommendations.map(movie => {
    const isSeries = movie.type === 'series';
    const isAnime = movie.genre?.toLowerCase().includes('anime') || movie.title?.toLowerCase().includes('mushoku') || movie.title?.toLowerCase().includes('re: zero');
    const badgeText = isAnime ? 'Anime HD' : (isSeries ? 'Serie TV' : 'Película');
    const movieJson = JSON.stringify(movie).replace(/"/g, '&quot;');
    return `
      <div class="movie-card" onclick="selectMovie(${movieJson})">
        <div class="movie-poster-box">
          <span class="badge-type ${isSeries ? 'series' : ''}">${escapeHtml(badgeText)}</span>
          <img class="movie-poster-img" src="${escapeHtml(movie.poster)}" alt="${escapeHtml(movie.title)}" loading="lazy">
          <div class="movie-hover-overlay">
            <button class="btn btn-netflix btn-sm">
              <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Ver Ahora
            </button>
          </div>
        </div>
        <div class="movie-info">
          <h4 class="movie-title">${escapeHtml(movie.title)}</h4>
          <div class="movie-meta-row">
            <span class="movie-year">${movie.year}</span>
            <span class="movie-rating-badge">${isSeries ? 'HD Serie' : 'Full HD'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Cargar catálogo de videos locales si hay backend
async function loadCineCatalog() {
  const grid = document.getElementById('moviesGrid');
  const countEl = document.getElementById('catalogCount');
  const localSection = document.getElementById('localMoviesSection');

  if (!isBackendConnected) {
    if (localSection) localSection.classList.add('hidden');
    return;
  }

  try {
    const res = await fetch('/api/cine/catalog');
    if (!res.ok) return;
    const movies = await res.json();
    if (countEl) countEl.textContent = `${movies.length} títulos`;

    if (movies.length === 0) {
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state-mini">
            <p>No tienes videos locales en D:\\PapusCloud\\cine aún. Puedes copiar videos directamente allí o ver el catálogo online.</p>
          </div>
        `;
      }
      return;
    }

    if (grid) {
      grid.innerHTML = movies.map(m => {
        const localMovieObj = {
          id: 'local_' + m.id,
          title: m.title,
          year: 'Local',
          type: 'movie',
          genre: m.category || 'Local',
          isLocal: true,
          localUrl: `/api/cine/stream/${m.id}`,
          desc: `Video local en disco D: (${formatBytes(m.size_bytes)})`
        };
        const movieJson = JSON.stringify(localMovieObj).replace(/"/g, '&quot;');
        return `
          <div class="movie-card" onclick="selectMovie(${movieJson})">
            <div class="movie-poster-box">
              <span class="badge-type">Disco D:</span>
              <div class="local-poster-placeholder">
                <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <div class="movie-hover-overlay">
                <button class="btn btn-netflix btn-sm">Ver Video</button>
              </div>
            </div>
            <div class="movie-info">
              <h4 class="movie-title">${escapeHtml(m.title)}</h4>
              <div class="movie-meta-row">
                <span class="movie-year">${formatBytes(m.size_bytes)}</span>
                <span class="movie-rating-badge">D: Local</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    console.warn('No se pudo cargar videos locales');
  }
}

// ------------------------------------------
// 6. PAPUSDRIVE (CUPO 500 GB & ESPACIO POR USUARIO)
// ------------------------------------------
async function loadStats() {
  const storageStat = document.getElementById('storageStat');
  const progressBar = document.getElementById('storageProgressBar');

  if (isBackendConnected) {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        if (storageStat) storageStat.textContent = `${data.freeQuotaGB} GB libres de 500 GB`;
        if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, data.percentUsed))}%`;
        return;
      }
    } catch (e) {}
  }

  // Modo Web (GitHub Pages)
  if (storageStat) storageStat.textContent = "500.00 GB disponibles";
  if (progressBar) progressBar.style.width = "0.5%";
}

async function loadDriveFiles() {
  const grid = document.getElementById('filesGrid');
  if (!grid) return;

  if (isBackendConnected) {
    try {
      const res = await fetch('/api/drive/files');
      if (res.ok) {
        allDriveFiles = await res.json();
        filterFiles();
        return;
      }
    } catch (e) {}
  }

  // Modo Web / IndexedDB / LocalStorage
  const userKey = `papus_client_files_${currentUser?.username?.toLowerCase() || 'invitado'}`;
  try {
    const clientFiles = JSON.parse(localStorage.getItem(userKey) || '[]');
    allDriveFiles = clientFiles;
  } catch (e) {
    allDriveFiles = [];
  }

  filterFiles();
}

function setFilter(filterType, btn) {
  activeFilter = filterType;
  const pills = document.querySelectorAll('.filter-pills .pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterFiles();
}

function filterFiles() {
  const grid = document.getElementById('filesGrid');
  const search = (document.getElementById('driveSearch')?.value || '').toLowerCase().trim();
  if (!grid) return;

  const currentUsername = currentUser?.username?.toLowerCase() || 'invitado';

  const filtered = allDriveFiles.filter(file => {
    const fileOwner = (file.owner_username || file.username || '').toLowerCase();
    const isPublic = file.is_public === 1 || file.is_public === true || file.isPublic;

    // Filtro de pestañas
    if (activeFilter === 'mine') {
      // Solo mis archivos privados
      if (fileOwner && fileOwner !== currentUsername) return false;
    } else if (activeFilter === 'public') {
      // Solo archivos compartidos públicamente
      if (!isPublic) return false;
    }

    // Filtro de búsqueda
    if (search && !file.original_name.toLowerCase().includes(search)) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    const emptyMsg = activeFilter === 'mine'
      ? `No tienes archivos privados en la cuenta "${escapeHtml(currentUser?.username || 'Invitado')}". ¡Sube uno arriba!`
      : (activeFilter === 'public' ? 'No hay archivos en el Drive Compartido aún.' : 'No se encontraron archivos.');

    grid.innerHTML = `
      <div class="empty-state">
        <svg class="icon-svg icon-xl" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <p>${emptyMsg}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(file => {
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.original_name);
    const isVideo = /\.(mp4|mkv|webm|mov)$/i.test(file.original_name);
    const isAudio = /\.(mp3|wav|ogg|flac)$/i.test(file.original_name);
    const isPublic = file.is_public === 1 || file.is_public === true || file.isPublic;

    const downloadUrl = file.url || (isBackendConnected ? `/api/drive/download/${file.id}` : file.dataUrl);

    return `
      <div class="file-card">
        <div class="file-icon-box">
          ${getFileIconSvg(file.original_name)}
          <span class="file-scope-pill ${isPublic ? 'public' : 'private'}">
            ${isPublic ? 'Público' : 'Privado'}
          </span>
        </div>
        <div class="file-details">
          <h4 class="file-name" title="${escapeHtml(file.original_name)}">${escapeHtml(file.original_name)}</h4>
          <div class="file-meta">
            <span>${formatBytes(file.size_bytes || file.size || 0)}</span>
            <span>${escapeHtml(file.owner_username || currentUser?.username || 'Papu')}</span>
          </div>
        </div>
        <div class="file-card-actions">
          ${downloadUrl ? `
            <a href="${downloadUrl}" download="${escapeHtml(file.original_name)}" class="btn btn-secondary btn-sm" title="Descargar">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </a>
          ` : ''}
          ${(isImage || isVideo || isAudio) ? `
            <button class="btn btn-primary btn-sm" onclick="previewFile('${escapeHtml(file.original_name)}', '${downloadUrl}')" title="Previsualizar">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function getFileIconSvg(filename) {
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  }
  if (/\.(mp4|mkv|webm|mov)$/i.test(filename)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  }
  if (/\.(mp3|wav|ogg|flac)$/i.test(filename)) {
    return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  }
  return `<svg class="icon-svg icon-lg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
}

// Subida de archivos
function handleFileSelect(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  uploadFile(files[0]);
}

async function uploadFile(file) {
  const isPublic = document.getElementById('publicToggle')?.checked || false;
  const progressBox = document.getElementById('uploadProgressBox');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressText = document.getElementById('uploadPercentage');
  const fileNameText = document.getElementById('uploadingFileName');

  if (progressBox) progressBox.classList.remove('hidden');
  if (fileNameText) fileNameText.textContent = `Subiendo: ${file.name}`;

  if (isBackendConnected) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_public', isPublic ? '1' : '0');
    formData.append('username', currentUser?.username || 'papu');

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/drive/upload', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          if (progressBar) progressBar.style.width = `${percent}%`;
          if (progressText) progressText.textContent = `${percent}%`;
        }
      };

      xhr.onload = () => {
        if (progressBox) progressBox.classList.add('hidden');
        if (xhr.status === 200) {
          loadDriveFiles();
          loadStats();
        } else {
          alert('Error al subir archivo al disco D:');
        }
      };

      xhr.onerror = () => {
        if (progressBox) progressBox.classList.add('hidden');
        alert('Error en la conexión con el servidor local.');
      };

      xhr.send(formData);
      return;
    } catch (err) {
      console.warn('Fallo subida backend, usando cliente', err);
    }
  }

  // Modo Web (GitHub Pages / Standalone en navegador)
  const reader = new FileReader();
  reader.onload = () => {
    const userKey = `papus_client_files_${currentUser?.username?.toLowerCase() || 'invitado'}`;
    let clientFiles = [];
    try {
      clientFiles = JSON.parse(localStorage.getItem(userKey) || '[]');
    } catch (e) {
      clientFiles = [];
    }

    const newFile = {
      id: 'web_' + Date.now(),
      original_name: file.name,
      size_bytes: file.size,
      owner_username: currentUser?.username || 'InvitadoPapu',
      is_public: isPublic ? 1 : 0,
      dataUrl: reader.result,
      created_at: new Date().toISOString()
    };

    clientFiles.unshift(newFile);
    try {
      localStorage.setItem(userKey, JSON.stringify(clientFiles));
    } catch (storageErr) {
      // Si el archivo es muy pesado para localStorage, guardar metadatos
      newFile.dataUrl = '';
      localStorage.setItem(userKey, JSON.stringify(clientFiles));
      alert('Archivo registrado en tu Drive privado.');
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = '100%';
    setTimeout(() => {
      if (progressBox) progressBox.classList.add('hidden');
      loadDriveFiles();
    }, 400);
  };

  reader.readAsDataURL(file);
}

function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone');
  if (!dropZone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, () => dropZone.classList.add('drag-active'));
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, () => dropZone.classList.remove('drag-active'));
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  });
}

function previewFile(name, url) {
  const modal = document.getElementById('previewModal');
  const title = document.getElementById('previewTitle');
  const content = document.getElementById('previewContent');

  title.textContent = name;
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) {
    content.innerHTML = `<img src="${url}" style="max-width:100%; max-height:75vh; border-radius:8px; display:block; margin:auto;" alt="${name}">`;
  } else if (/\.(mp4|webm|mov)$/i.test(name)) {
    content.innerHTML = `<video controls autoplay style="width:100%; max-height:75vh; border-radius:8px;" src="${url}"></video>`;
  } else if (/\.(mp3|wav|ogg)$/i.test(name)) {
    content.innerHTML = `<div style="padding:2rem; text-align:center;"><audio controls autoplay src="${url}"></audio></div>`;
  } else {
    content.innerHTML = `<p style="padding:2rem; text-align:center; color:var(--text-muted);">Previsualización no disponible para este tipo de archivo.</p>`;
  }

  modal.classList.remove('hidden');
}

function closePreviewModal() {
  const modal = document.getElementById('previewModal');
  const content = document.getElementById('previewContent');
  if (modal) modal.classList.add('hidden');
  if (content) content.innerHTML = '';
}

// ------------------------------------------
// 7. NAVEGACIÓN Y TABS
// ------------------------------------------
function switchTab(tab) {
  currentTab = tab;
  const btnCine = document.getElementById('tabCineBtn');
  const btnDrive = document.getElementById('tabDriveBtn');
  const secCine = document.getElementById('sectionCine');
  const secDrive = document.getElementById('sectionDrive');

  if (tab === 'cine') {
    btnCine.classList.add('active');
    btnDrive.classList.remove('active');
    secCine.classList.add('active');
    secDrive.classList.remove('active');
  } else {
    btnDrive.classList.add('active');
    btnCine.classList.remove('active');
    secDrive.classList.add('active');
    secCine.classList.remove('active');
    loadDriveFiles();
  }
}

// ------------------------------------------
// 8. WATCH PARTY CHAT & WEBSOCKETS
// ------------------------------------------
function setupWebSocket() {
  if (!window.WebSocket) return;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  try {
    ws = new WebSocket(`${protocol}//${host}`);

    ws.onopen = () => {
      addChatMessage('Sistema', 'Conectado a la sala en vivo de Los Papus.', 'system');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSocketMessage(data);
      } catch (e) {}
    };

    ws.onclose = () => {
      // Reintentar en segundo plano silenciosamente
      setTimeout(setupWebSocket, 5000);
    };
  } catch (e) {}
}

function handleSocketMessage(msg) {
  if (msg.type === 'CHAT_MESSAGE') {
    addChatMessage(msg.sender, msg.text, 'user');
  } else if (msg.type === 'LOAD_MEDIA') {
    addChatMessage('Sala', `${msg.sender} cambió la transmisión a: ${msg.title}`, 'system');
  } else if (msg.type === 'USER_COUNT') {
    const countEl = document.getElementById('onlineCount');
    if (countEl) countEl.textContent = msg.count;
  }
}

function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const sender = currentUser?.username || 'Papu';

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      sender,
      text
    }));
  } else {
    // Si no hay websocket activo, mostrar localmente
    addChatMessage(sender, text, 'user');
  }

  input.value = '';
}

function addChatMessage(sender, text, type = 'user') {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${type}`;

  if (type === 'system') {
    msgDiv.innerHTML = `<p>[${escapeHtml(sender)}] ${escapeHtml(text)}</p>`;
  } else {
    msgDiv.innerHTML = `
      <div class="msg-meta">
        <span class="msg-author">${escapeHtml(sender)}</span>
        <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <p class="msg-body">${escapeHtml(text)}</p>
    `;
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

// ------------------------------------------
// 9. UTILIDADES
// ------------------------------------------
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
