// ===== Config =====
const APILINK = 'https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=8264947b805ec4f8f6b431056e5a8088&page=1';
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';
const POSTER_PATH = 'https://image.tmdb.org/t/p/w500';
const SEARCHAPI = "https://api.themoviedb.org/3/search/movie?&api_key=8264947b805ec4f8f6b431056e5a8088&query=";

// ===== DOM =====
const main = document.getElementById("section");
const form = document.getElementById("form");
const search = document.getElementById("query");
const showFavsBtn = document.getElementById("show-favs");
const loadMoreBtn = document.getElementById("load-more");
const logoutBtn = document.getElementById('logout-btn'); // <-- Log Out butonu

// Modal
const modal = document.getElementById('movie-modal');
const modalCloseBtn = document.getElementById('modal-close');
const modalPoster = document.getElementById('movie-poster');
const modalTitle = document.getElementById('movie-title');
const modalOverview = document.getElementById('movie-overview');

// ===== Auth + Per-user favorites helpers =====
function getCurrentUser() {
  return localStorage.getItem('currentUser'); // login.js girişte set eder
}
function favKeyFor(email) {
  return `favs_${email}`;
}
function loadFavSet() {
  const email = getCurrentUser();
  if (!email) return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(favKeyFor(email)) || '[]'));
  } catch {
    return new Set();
  }
}
function saveFavSet(set) {
  const email = getCurrentUser();
  if (!email) return;
  localStorage.setItem(favKeyFor(email), JSON.stringify([...set]));
}
function requireLogin() {
  if (!getCurrentUser()) {
    alert('Please log in to use Favorites.');
    location.href = 'login.html';
    return false;
  }
  return true;
}
// Eski 'favs' anahtarını mevcut kullanıcıya taşı (opsiyonel, nazik geçiş)
function migrateLegacyFavs() {
  const email = getCurrentUser();
  if (!email) return;
  const legacy = JSON.parse(localStorage.getItem('favs') || '[]');
  if (!legacy.length) return;
  const key = favKeyFor(email);
  const existing = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
  legacy.forEach(id => existing.add(id));
  localStorage.setItem(key, JSON.stringify([...existing]));
  localStorage.removeItem('favs');
}
function toggleFavForCurrentUser(id, title) {
  if (!requireLogin()) return { nowFav: false };
  const set = loadFavSet();
  if (set.has(id)) {
    set.delete(id);
    saveFavSet(set);
    if (typeof showToast === 'function') showToast(`"${title}" removed from Favorites`);
  } else {
    set.add(id);
    saveFavSet(set);
    if (typeof showToast === 'function') showToast(`"${title}" added to Favorites`);
  }
  return { nowFav: set.has(id) };
}

// ===== Logout (her zaman görünür) =====
if (logoutBtn) {
  const u = getCurrentUser();
  if (u) logoutBtn.textContent = `Log Out`; // istersen e-postayı göster
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    // görünümü sıfırlamak istersen:
    showingFavs = false;
    try { updateLoadMoreButton?.(); } catch {}
    location.href = 'login.html';
  });
}

// ===== Pagination state =====
let showingFavs = false;
let currentPage = 1;
let totalPages = 1;
let loading = false;
let baseURL = stripPage(APILINK); // URL without &page=

initList(baseURL);

// ---------- Helpers ----------
function stripPage(url){ return url.replace(/([?&])page=\d+(&)?/g, (m,p1,p2)=> p2 ? p1 : ''); }
function paged(urlBase, page){
  const base = stripPage(urlBase);
  const glue = base.includes('?') ? '&' : '?';
  return `${base}${glue}page=${page}`;
}

function initList(newBase){
  // opsiyonel geçiş: eski 'favs' -> kullanıcıya özel
  migrateLegacyFavs();

  showingFavs = false;
  baseURL = stripPage(newBase);
  currentPage = 1;
  totalPages = 1;
  main.innerHTML = '';
  updateLoadMoreButton();
  returnMovies(baseURL, currentPage, /*append*/ false);
}

function updateLoadMoreButton(){
  if (!loadMoreBtn) return;
  if (showingFavs) {
    loadMoreBtn.style.display = 'none';
    return;
  }
  const more = currentPage < totalPages;
  loadMoreBtn.style.display = more ? 'inline-block' : 'none';
  loadMoreBtn.disabled = loading;
  loadMoreBtn.textContent = loading ? 'Loading…' : 'Show More';
}

// ---------- Fetch & Render ----------
function returnMovies(urlBase, page = 1, append = false) {
  loading = true;
  updateLoadMoreButton();

  fetch(paged(urlBase, page))
    .then(res => res.json())
    .then(({ results = [], page:pg, total_pages }) => {
      if (typeof pg === 'number') currentPage = pg;
      if (typeof total_pages === 'number') totalPages = total_pages;
      renderMovies(results, append);
    })
    .catch(err => {
      console.error('Fetch error:', err);
      if (!append) main.innerHTML = `<p style="color:#fff;padding:20px">Something went wrong. Please try again.</p>`;
    })
    .finally(() => {
      loading = false;
      updateLoadMoreButton();
    });
}

function renderMovies(list, append = false) {
  if (!append) main.innerHTML = '';

  // Kullanıcının mevcut favori seti
  const favSet = loadFavSet();

  // Create or reuse grid row
  let div_row = main.querySelector('.row');
  if (!div_row) {
    div_row = document.createElement('div');
    div_row.setAttribute('class', 'row');
    main.appendChild(div_row);
  }

  list.forEach(element => {
    const div_column = document.createElement('div');
    div_column.setAttribute('class', 'column');

    const div_card = document.createElement('div');
    div_card.setAttribute('class', 'card');
    div_card.style.cursor = 'pointer';

    const image = document.createElement('img');
    image.setAttribute('class', 'thumbnail');
    image.loading = 'lazy';
    image.src = element.poster_path ? (IMG_PATH + element.poster_path) : 'images/movie.png';
    image.alt = element.title || 'Movie Poster';

    const title = document.createElement('h3');
    title.innerText = element.title || 'Untitled';

    // ==== Rating badge + Favorite button ====
    const vote = formatVote(element.vote_average);
    const voteClass = colorForVote(element.vote_average);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const voteSpan = document.createElement('span');
    voteSpan.className = `vote ${voteClass}`;
    voteSpan.textContent = vote;

    const favBtn = document.createElement('button');
    favBtn.className = 'fav inline';
    const isFav = favSet.has(element.id);
    favBtn.textContent = isFav ? '★' : '☆';
    favBtn.title = isFav ? 'Remove from Favorites' : 'Add to Favorites';

    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const { nowFav } = toggleFavForCurrentUser(element.id, element.title || 'Movie');

      // local görünümü güncelle
      if (nowFav) favSet.add(element.id);
      else favSet.delete(element.id);

      favBtn.textContent = nowFav ? '★' : '☆';
      favBtn.title = nowFav ? 'Remove from Favorites' : 'Add to Favorites';

      if (showingFavs && !nowFav) {
        div_column.remove();
      }
    });

    meta.append(voteSpan, favBtn);
    // =======================================

    // Open modal on card click
    div_card.addEventListener('click', () => {
      openModal({
        title: element.title,
        overview: element.overview,
        poster_path: element.poster_path
      });
    });

    div_card.append(image, title, meta);
    div_column.appendChild(div_card);
    div_row.appendChild(div_column);
  });
}

// ---------- Load More ----------
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    if (loading) return;
    if (showingFavs) return; // hidden anyway
    currentPage += 1;
    returnMovies(baseURL, currentPage, /*append*/ true);
  });
}

// ---------- Search ----------
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = search.value?.trim();
    if (q) {
      initList(SEARCHAPI + encodeURIComponent(q));
      search.value = '';
    } else {
      initList(APILINK);
    }
  });
}

// ---------- Live Search (input event) ----------
if (search) {
  search.addEventListener("input", (e) => {
    const q = e.target.value.trim();
    if (q.length === 0) {
      initList(APILINK); // input boşsa default listeye dön
      return;
    }

    // API'den getir
    fetch(SEARCHAPI + encodeURIComponent(q))
      .then(res => res.json())
      .then(data => {
        // sadece baş harfi eşleşenleri filtrele (ör: sadece 'w' ile başlayan)
        const filtered = data.results.filter(m =>
          m.title?.toLowerCase().startsWith(q.toLowerCase())
        );
        renderMovies(filtered, false);
      })
      .catch(err => console.error("Live search error:", err));
  });
}


// ---------- Favorites toggle ----------
if (showFavsBtn) {
  showFavsBtn.addEventListener('click', () => {
    // login zorunlu
    if (!getCurrentUser()) {
      alert('Please log in to view Favorites.');
      location.href = 'login.html';
      return;
    }
    showingFavs = !showingFavs;
    updateFavsButton();
    if (showingFavs) {
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      loadFavorites();
    } else {
      initList(APILINK);
    }
  });
}

function updateFavsButton() {
  if (!showFavsBtn) return;
  showFavsBtn.textContent = showingFavs ? '↩️ Show All' : '⭐ My Favorites';
}

// ---------- Load favorites (no pagination) ----------
function loadFavorites() {
  const email = getCurrentUser();
  if (!email) {
    alert('Please log in to view Favorites.');
    location.href = 'login.html';
    return;
  }

  const favIds = [...loadFavSet()];
  if (favIds.length === 0) {
    main.innerHTML = `<p style="color:#fff;padding:20px">You didn't choose any movie ⭐</p>`;
    return;
  }
  main.innerHTML = `<p style="color:#fff;padding:20px">Loading favorites…</p>`;

  Promise.all(
    favIds.map(id =>
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=8264947b805ec4f8f6b431056e5a8088`)
        .then(r => r.json())
        .catch(() => null)
    )
  ).then(movies => {
    const valid = movies.filter(m => m && m.id);
    renderMovies(valid, /*append*/ false);
  });
}

// ---------- Modal helpers ----------
function openModal({ title, overview, poster_path }) {
  modalTitle.textContent = title || 'No title';
  modalOverview.textContent = overview?.length ? overview : 'No overview available.';
  if (poster_path) {
    modalPoster.src = POSTER_PATH + poster_path;
    modalPoster.alt = title ? `${title} poster` : 'Movie poster';
    modalPoster.style.display = 'block';
  } else {
    modalPoster.removeAttribute('src');
    modalPoster.alt = '';
    modalPoster.style.display = 'none';
  }
  document.body.style.overflow = 'hidden';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  modalCloseBtn.focus();
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

// ---------- Vote helpers ----------
function formatVote(v) {
  const n = Number(v);
  if (Number.isFinite(n) && n > 0) return n.toFixed(1);
  return '—';
}
function colorForVote(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'bad';
  if (n >= 7.5) return 'good';
  if (n >= 5.5) return 'avg';
  return 'bad';
}

// ---------- Toast ----------
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}