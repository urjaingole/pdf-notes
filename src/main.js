import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import './style.css';
import './reader.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/* ---------- Layout: scales the 1920px-wide design to the window (library) ---------- */

let capRatio = 0.7; // capital letter height / font size (measured once the font loads)
let belowBaseline = 0.2;

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

function layout() {
  const root = document.documentElement;
  const dpr = window.devicePixelRatio || 1;
  const vw = root.clientWidth;
  const u = Math.min(1, Math.max(0.6, vw / 1920));
  const snap = (v) => Math.max(1, Math.round(v * dpr)) / dpr; // whole device pixels
  const n = (v) => +v.toFixed(3);

  const cell = snap(18 * u); // square grid
  const hatch = snap(20 * u); // distance between diagonal hatch lines
  const hair = 1 / dpr; // thinnest line the screen can draw

  // Frame: a whole number of grid cells wide, so the grid ends exactly on the margins
  const side = vw < 800 ? 16 : 96 * u;
  const frameMax = Math.min(1674 * u, vw - 2 * side);
  const frameW = Math.max(8 * cell, Math.floor(frameMax / cell) * cell);
  const frameX = Math.round(((vw - frameW) / 2) * dpr) / dpr;

  const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n(cell)}" height="${n(cell)}"><path d="M0 ${n(hair / 2)}H${n(cell)}M${n(hair / 2)} 0V${n(cell)}" stroke="#D9EFEE" stroke-width="${n(hair)}" fill="none" shape-rendering="crispEdges"/></svg>`;
  const hatchSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n(hatch)}" height="${n(hatch)}"><path d="M-2 -2L${n(hatch + 2)} ${n(hatch + 2)}" stroke="#D9EFEE" stroke-width="${n(hair)}" fill="none"/></svg>`;

  const set = (k, v) => root.style.setProperty(k, v);
  set('--u', u.toFixed(4));
  set('--cell', n(cell) + 'px');
  set('--frame-w', n(frameW) + 'px');
  set('--frame-x', n(frameX) + 'px');
  set('--grid-img', svgUrl(gridSvg));
  set('--hatch-img', svgUrl(hatchSvg));
  // Title: capital letters exactly 4 cells tall (minus 1px so round letters just touch the line)
  set('--title-fs', n((4 * cell - 1) / capRatio) + 'px');
  set('--below-baseline', n(belowBaseline));
}

async function measureTitleFont() {
  try {
    await document.fonts.load('400 100px "IBM Plex Sans Condensed"');
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = '400 100px "IBM Plex Sans Condensed", system-ui, sans-serif';
    const m = ctx.measureText('H');
    const cap = m.actualBoundingBoxAscent / 100;
    if (cap > 0.4 && cap < 1) capRatio = cap;
    if (m.fontBoundingBoxAscent !== undefined) {
      const asc = m.fontBoundingBoxAscent / 100;
      const desc = m.fontBoundingBoxDescent / 100;
      belowBaseline = (1 - asc + desc) / 2;
    }
  } catch (e) {
    /* keep the defaults */
  }
  layout();
}

layout();
measureTitleFont();
window.addEventListener('resize', layout);
new ResizeObserver(layout).observe(document.documentElement);

/* ---------- Constants and icons ---------- */

const BASE_SCALE = 1.4; // highlights are stored at this scale and scaled to the current zoom
const MAX_PAPERS = 100;
const MAX_COLORS = 8;
const THUMB_W = 142;
const THUMBS_AUTOHIDE = true; // false keeps the page thumbnails always visible
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 2.5, 3];

// Overview: notes appear at this zoom level and below
const OV_MAX_ZOOM = 0.4;
const OV_GAP = 72; // space between the page column and the notes
const OV_NOTE_MAX = 380;
const OV_NOTE_MIN = 200;
const OV_SPACE = 16; // space between stacked notes

// Big heading: change the wording here
const TITLE_PAPERS = 'Library will contain the papers which you had accessed last';
const TITLE_EMPTY = 'PIN NOTES TO YOUR PDF';

const ICON_PENCIL = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 21l1.3-5.2L16.1 4a2.1 2.1 0 0 1 3 0l.9.9a2.1 2.1 0 0 1 0 3L8.2 19.7z" fill="currentColor"/></svg>`;

function binIcon(fill, cross, w = 16) {
  const h = Math.round(((w * 26) / 24) * 100) / 100;
  return `<svg viewBox="0 0 24 26" width="${w}" height="${h}" aria-hidden="true"><rect x="8" y="0" width="8" height="3" rx="1.4" fill="${fill}"/><rect x="0.4" y="2.2" width="23.2" height="3.6" rx="1.6" fill="${fill}"/><path d="M2 5h20v17.2a3.8 3.8 0 0 1-3.8 3.8H5.8A3.8 3.8 0 0 1 2 22.2z" fill="${fill}"/><path d="M8.2 11.4l7.6 7.6m0-7.6l-7.6 7.6" stroke="${cross}" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>`;
}

/* ---------- Categories (colors) and settings ---------- */

const DEFAULT_COLORS = [
  { id: 'blue', hex: '#B2E0FF', label: 'Ideas' },
  { id: 'mint', hex: '#A6F5DD', label: 'Links' },
  { id: 'green', hex: '#B9FFB1', label: 'Definitions' },
  { id: 'pink', hex: '#FFCBCC', label: 'People/Years' },
];

// Stroke colors taken from the design
const STROKES = {
  '#b2e0ff': '#26b4fe',
  '#a6f5dd': '#30dfc5',
  '#b9ffb1': '#6fd960',
  '#ffcbcc': '#ff8e8e',
};

const SETTINGS_KEY = 'pdfnotes.settings';
let settings = loadSettings();

function loadSettings() {
  const base = { labels: {}, active: 'blue', filter: [], custom: [], overview: true };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = { ...base, ...JSON.parse(raw) };
      if (!Array.isArray(s.filter)) s.filter = [];
      if (!Array.isArray(s.custom)) s.custom = [];
      delete s.hidden; // old setting, replaced by "filter"
      return s;
    }
  } catch (e) {
    /* storage unavailable: use defaults */
  }
  return base;
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    /* ignore */
  }
}

const allColors = () => [...DEFAULT_COLORS, ...(settings.custom || [])];
const colorById = (id) => allColors().find((c) => c.id === id) || DEFAULT_COLORS[0];
const labelOf = (c) => (settings.labels[c.id] || '').trim() || c.label;

// Nothing selected means show everything
const isShown = (id) => settings.filter.length === 0 || settings.filter.includes(id);

function sanitizeSettings() {
  const ids = allColors().map((c) => c.id);
  settings.filter = settings.filter.filter((id) => ids.includes(id));
  if (!ids.includes(settings.active)) settings.active = DEFAULT_COLORS[0].id;
}
sanitizeSettings();

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

// A slightly darker, richer version of the same color (used for strokes)
function strokeOf(hex) {
  const known = STROKES[String(hex).toLowerCase()];
  if (known) return known;
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(1, s * 1.15 + 0.05), Math.max(0, l - 0.2));
}

function isDark(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lum =
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.5;
}

const noteFg = (c) => (isDark(c.hex) ? '#ffffff' : 'rgba(0, 0, 0, 0.8)');

/* ---------- Elements and state ---------- */

const fileInput = document.getElementById('file-input');
const pagesEl = document.getElementById('pages');
const libraryEl = document.getElementById('library');
const listEl = document.getElementById('lib-list');
const countEl = document.getElementById('lib-count');
const msgEl = document.getElementById('lib-msg');
const titleTextEl = document.getElementById('title-text');

const readerUi = document.getElementById('reader-ui');
const backBtn = document.getElementById('back-btn');
const paperTab = document.getElementById('paper-tab');
const paperNameEl = document.getElementById('paper-name');
const paperMenu = document.getElementById('paper-menu');
const catsBtn = document.getElementById('cats-btn');
const catsLabel = document.getElementById('cats-label');
const catsPen = document.getElementById('cats-pen');
const catsMenu = document.getElementById('cats-menu');
const thumbsEl = document.getElementById('thumbs');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomToast = document.getElementById('zoom-toast');
const overviewBtn = document.getElementById('overview-btn');
const overviewState = document.getElementById('overview-state');

let highlights = [];
let currentPaper = null;
let loadToken = 0;
let popover = null;
let ovLayer = null;
let state = { mode: 'hidden', h: null };
let chipTimer = null;
let saveTimer = null;
let msgTimer = null;
let upgrading = false;
let creating = false; // the "create new category" form is open
let reading = false;
const titleEls = new Map();

function setState(s) {
  clearTimeout(chipTimer);
  state = s;
}

/* ---------- Saving in the browser (IndexedDB) ---------- */

let dbPromise = null;

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('pdfnotes', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('papers', { keyPath: 'id' });
        db.createObjectStore('files', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

const reqP = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function dbGet(store, id) {
  const db = await openDB();
  return reqP(db.transaction(store).objectStore(store).get(id));
}
async function dbGetAll(store) {
  const db = await openDB();
  return reqP(db.transaction(store).objectStore(store).getAll());
}
async function dbPut(store, value) {
  const db = await openDB();
  return reqP(db.transaction(store, 'readwrite').objectStore(store).put(value));
}
async function dbDelete(store, id) {
  const db = await openDB();
  return reqP(db.transaction(store, 'readwrite').objectStore(store).delete(id));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 400);
}

async function flushSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!currentPaper) return;
  try {
    await dbPut('papers', { ...currentPaper, highlights });
  } catch (err) {
    console.error('Could not save', err);
  }
}

window.addEventListener('pagehide', () => {
  if (saveTimer) flushSave();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && saveTimer) flushSave();
});

// Call after any change to highlights or notes
function commit() {
  drawHighlights();
  scheduleSave();
}

/* ---------- Paper titles ---------- */

const capitalise = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

// "Pixar_Animation-Studios_(1).pdf" -> "Pixar Animation Studios"
function cleanTitle(raw) {
  let t = String(raw || '').replace(/\.pdf$/i, '');
  try {
    t = decodeURIComponent(t);
  } catch (e) {
    /* not URL-encoded */
  }
  t = t.replace(/[_\-–—+]+/g, ' ');
  t = t.replace(/\s*\(\d+\)\s*$/, '');
  t = t.replace(/\s+/g, ' ').trim();
  return capitalise(t) || 'Untitled paper';
}

// The title stored inside the PDF, if it looks like a real title
function usableMetaTitle(raw) {
  const t = String(raw || '').replace(/\s+/g, ' ').trim();
  if (t.length < 8 || t.length > 200) return '';
  if (!/\s/.test(t)) return '';
  if (/^(microsoft word|untitled|document|manuscript|slide)/i.test(t)) return '';
  if (/\.(docx?|tex|pdf|indd|pptx?)$/i.test(t)) return '';
  return capitalise(t);
}

async function titleFromPdf(pdf, fileName) {
  try {
    const m = await pdf.getMetadata();
    const t = usableMetaTitle(m && m.info && m.info.Title);
    if (t) return t;
  } catch (e) {
    /* no metadata */
  }
  return cleanTitle(fileName);
}

// Older saved papers: look up their real title once, in the background
async function upgradeTitles(papers) {
  if (upgrading) return;
  upgrading = true;
  try {
    for (const p of papers) {
      if (p.titleChecked) continue;
      if (currentPaper) break; // a paper is open; try again next time
      try {
        const rec = await dbGet('files', p.id);
        if (!rec) continue;
        const data = await rec.blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const title = await titleFromPdf(pdf, p.name);
        const fresh = await dbGet('papers', p.id);
        if (fresh) {
          fresh.title = title;
          fresh.titleChecked = true;
          await dbPut('papers', fresh);
        }
        const el = titleEls.get(p.id);
        if (el) {
          el.textContent = title;
          if (el.parentElement) el.parentElement.title = title;
        }
      } catch (err) {
        console.error(err);
      }
    }
  } finally {
    upgrading = false;
  }
}

/* ---------- Views: library and reader ---------- */

function setView(view) {
  reading = view === 'reader';
  libraryEl.classList.toggle('hidden', reading);
  pagesEl.classList.toggle('hidden', !reading);
  readerUi.classList.toggle('hidden', !reading);
  document.body.classList.toggle('reading', reading);
  if (!reading) closeMenus();
  window.scrollTo(0, 0);
}

function showMsg(text) {
  msgEl.textContent = text;
  msgEl.classList.remove('hidden');
  clearTimeout(msgTimer);
  msgTimer = setTimeout(hideMsg, 8000);
}
function hideMsg() {
  msgEl.classList.add('hidden');
}

const formatDate = (ts) =>
  new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/* ---------- Library ---------- */

async function refreshLibrary() {
  let papers = [];
  try {
    papers = await dbGetAll('papers');
  } catch (err) {
    console.error(err);
    showMsg("Saving isn't available in this browser (private windows often block it).");
  }
  papers.sort((a, b) => b.openedAt - a.openedAt);

  // Empty home page explains the product; once there are papers it says "Your papers"
  titleTextEl.textContent = papers.length ? TITLE_PAPERS : TITLE_EMPTY;

  countEl.textContent = `${papers.length} OF ${MAX_PAPERS} PAPERS`;
  listEl.innerHTML = '';
  titleEls.clear();

  if (!papers.length) {
    const empty = document.createElement('p');
    empty.className = 'lib-empty';
    empty.textContent = 'No papers yet. Press ADD to open a PDF.';
    listEl.appendChild(empty);
    return;
  }

  papers.forEach((p) => {
    const hl = p.highlights || [];
    const notes = hl.filter((h) => h.note).length;
    const shownTitle = p.title || cleanTitle(p.name);

    const card = document.createElement('div');
    card.className = 'paper-card'; card.dataset.id = p.id;

    const open = document.createElement('button');
    open.className = 'paper-open';
    open.title = shownTitle;

    const title = document.createElement('span');
    title.className = 'paper-title';
    title.textContent = shownTitle;
    titleEls.set(p.id, title);

    const meta = document.createElement('span');
    meta.className = 'paper-meta';

    const line1 = document.createElement('span');
    const n = document.createElement('b');
    n.textContent = notes;
    line1.append(n, ` ${notes === 1 ? 'Note' : 'Notes'}`);

    const line2 = document.createElement('span');
    const d = document.createElement('b');
    d.textContent = formatDate(p.openedAt);
    line2.append('Last opened ', d);

    meta.append(line1, line2);
    open.append(title, meta);
    open.onclick = () => openPaper(p.id);

    const del = document.createElement('button');
    del.className = 'del-btn card-del';
    del.innerHTML = binIcon('#ff5252', '#ffffff', 13);
    del.title = 'Delete paper';
    del.setAttribute('aria-label', 'Delete ' + shownTitle);
    del.onclick = async () => {
      if (!confirm(`Delete "${shownTitle}" and all its highlights and notes?`)) return;
      await dbDelete('papers', p.id);
      await dbDelete('files', p.id);
      refreshLibrary();
    };

    card.append(open, del);
    listEl.appendChild(card);
  });

  upgradeTitles(papers);
}

async function openPaper(id) {
  try {
    const meta = await dbGet('papers', id);
    const rec = await dbGet('files', id);
    if (!meta || !rec) {
      showMsg("That paper couldn't be found. It may have been removed.");
      await refreshLibrary();
      return;
    }
    meta.openedAt = Date.now();
    await dbPut('papers', meta);
    await showReader(meta, rec.blob);
  } catch (err) {
    console.error(err);
    showMsg("That paper couldn't be opened.");
  }
}

async function goToLibrary() {
  loadToken++;
  await flushSave();
  currentPaper = null;
  highlights = [];
  hidePopover();
  teardownReader();
  document.title = 'PDF Notes';
  setView('library');
  await refreshLibrary();
}

backBtn.addEventListener('click', goToLibrary);

// Adding a PDF
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  hideMsg();

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const id = (pdf.fingerprints && pdf.fingerprints[0]) || `${file.name}-${file.size}`;

    // Same paper added again: just open the saved copy
    if (await dbGet('papers', id)) {
      await openPaper(id);
      return;
    }

    const all = await dbGetAll('papers');
    if (all.length >= MAX_PAPERS) {
      showMsg(`Your library is full (${MAX_PAPERS} papers). Delete one to add another.`);
      return;
    }

    const now = Date.now();
    const meta = {
      id,
      name: file.name.replace(/\.pdf$/i, ''),
      title: await titleFromPdf(pdf, file.name),
      titleChecked: true,
      size: file.size,
      addedAt: now,
      openedAt: now,
      highlights: [],
    };
    await dbPut('files', { id, blob: file });
    await dbPut('papers', meta);
    try {
      navigator.storage?.persist?.();
    } catch (err) {
      /* ignore */
    }
    await showReader(meta, file);
  } catch (err) {
    console.error(err);
    showMsg(
      `That file couldn't be opened or saved (${err.name}: ${err.message}). Check it's a valid PDF and that your browser allows site storage.`
    );
  }
});

/* ---------- Reader: pages, zoom and rendering ---------- */

let pdfDoc = null;
let pageSizes = [];
let pageEls = [];
let thumbEls = [];
let io = null;
let thumbIO = null;
const visiblePages = new Set();
let zoom = 1;
let baseWidth = 900;
let layoutVer = 0;
let rerenderTimer = null;
let currentPage = 1;

// Page width at 100% zoom: about 62% of the window, as in the design
function computeBaseWidth() {
  const w = window.innerWidth;
  return Math.round(Math.max(360, Math.min(1100, w * 0.62, w - 120)));
}

function teardownReader() {
  loadToken++;
  if (io) {
    io.disconnect();
    io = null;
  }
  if (thumbIO) {
    thumbIO.disconnect();
    thumbIO = null;
  }
  visiblePages.clear();
  pageEls = [];
  thumbEls = [];
  pageSizes = [];
  pdfDoc = null;
  ovLayer = null;
  document.body.classList.remove('ov-on');
  pagesEl.innerHTML = '';
  thumbsEl.innerHTML = '';
  closeMenus();
}

async function loadSizes(pdf) {
  const sizes = [];
  for (let i = 1; i <= pdf.numPages; i += 25) {
    const count = Math.min(25, pdf.numPages - i + 1);
    const batch = await Promise.all(
      Array.from({ length: count }, (_, j) =>
        pdf.getPage(i + j).then((p) => p.getViewport({ scale: 1 }))
      )
    );
    batch.forEach((v) => sizes.push({ w: v.width, h: v.height }));
  }
  return sizes;
}

async function showReader(meta, blob) {
  const token = ++loadToken;
  teardownReader();
  loadToken = token;

  currentPaper = meta;
  highlights = meta.highlights || [];
  setState({ mode: 'hidden', h: null });

  const shownTitle = meta.title || cleanTitle(meta.name);
  document.title = shownTitle + ' · PDF Notes';
  paperNameEl.textContent = shownTitle;
  paperNameEl.title = shownTitle;

  popover = document.createElement('div');
  popover.className = 'popover hidden';
  pagesEl.appendChild(popover);
  setView('reader');

  zoom = 1;
  baseWidth = computeBaseWidth();
  renderCats();
  renderOverview();

  try {
    const data = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    if (token !== loadToken) return;
    pdfDoc = pdf;

    const sizes = await loadSizes(pdf);
    if (token !== loadToken) return;
    pageSizes = sizes;

    buildPages();
    buildThumbs();
    layoutPages();
    window.scrollTo(0, 0);
    updateCurrentPage();
  } catch (err) {
    console.error(err);
    await goToLibrary();
    showMsg("That paper couldn't be displayed.");
  }
}

function buildPages() {
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const n = Number(e.target.dataset.page);
        if (e.isIntersecting) {
          visiblePages.add(n);
          renderPageContent(n);
        } else {
          visiblePages.delete(n);
          unloadPage(e.target);
        }
      });
    },
    { rootMargin: '1500px 0px 1500px 0px' }
  );

  pageSizes.forEach((_, i) => {
    const el = document.createElement('div');
    el.className = 'page';
    el.dataset.page = i + 1;
    const layer = document.createElement('div');
    layer.className = 'highlightLayer';
    el.appendChild(layer);
    pagesEl.appendChild(el);
    pageEls.push(el);
    io.observe(el);
  });
}

// Sets every page to the current zoom. Pictures already drawn are stretched
// until the sharp version is ready, so nothing flickers.
function layoutPages() {
  const w = baseWidth * zoom;
  pageEls.forEach((el, i) => {
    const sz = pageSizes[i];
    const scale = w / sz.w;
    el.dataset.scale = scale.toFixed(5);
    el.style.width = w + 'px';
    el.style.height = sz.h * scale + 'px';
    el.style.setProperty('--scale-factor', scale);
    el.style.setProperty('--total-scale-factor', scale);
  });
  layoutVer++;
  drawHighlights();
  scheduleRerender();
}

function scheduleRerender() {
  clearTimeout(rerenderTimer);
  rerenderTimer = setTimeout(() => {
    visiblePages.forEach((n) => renderPageContent(n));
  }, 140);
}

function unloadPage(el) {
  el.querySelectorAll(':scope > canvas, :scope > .textLayer').forEach((x) => x.remove());
  el.dataset.ver = '';
  el.dataset.busy = '';
}

async function renderPageContent(n) {
  const el = pageEls[n - 1];
  if (!el || !pdfDoc) return;
  const ver = layoutVer;
  if (el.dataset.ver === String(ver) || el.dataset.busy === String(ver)) return;
  el.dataset.busy = String(ver);

  try {
    const page = await pdfDoc.getPage(n);
    if (ver !== layoutVer || !el.isConnected) return;

    const scale = Number(el.dataset.scale);
    const viewport = page.getViewport({ scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
    }).promise;
    if (ver !== layoutVer || !el.isConnected) return;

    const layer = el.querySelector('.highlightLayer');
    const textEl = document.createElement('div');
    textEl.className = 'textLayer';
    textEl.style.visibility = 'hidden';
    el.insertBefore(textEl, layer);
    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: page.streamTextContent(),
      container: textEl,
      viewport,
    });
    await textLayer.render();
    if (ver !== layoutVer || !el.isConnected) {
      textEl.remove();
      return;
    }

    // swap in the sharp version
    el.querySelectorAll(':scope > canvas, :scope > .textLayer').forEach((x) => {
      if (x !== textEl) x.remove();
    });
    el.insertBefore(canvas, el.firstChild);
    textEl.style.visibility = '';
    el.dataset.ver = String(ver);
  } catch (err) {
    console.error(err);
  } finally {
    if (el.dataset.busy === String(ver)) el.dataset.busy = '';
  }
}

/* ---------- Zoom ---------- */

let toastTimer = null;
function showToast(text) {
  zoomToast.textContent = text;
  zoomToast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => zoomToast.classList.add('hidden'), 1100);
}

function setZoom(z) {
  const next = Math.min(3, Math.max(0.25, z));
  if (!pageEls.length || Math.abs(next - zoom) < 0.001) return;
  const doc = document.documentElement;
  const centerRatio = (window.scrollY + window.innerHeight / 2) / doc.scrollHeight;
  zoom = next;
  hidePopover();
  layoutPages();
  window.scrollTo(window.scrollX, centerRatio * doc.scrollHeight - window.innerHeight / 2);
  showToast(Math.round(zoom * 100) + '%');
}

function zoomStep(dir) {
  let next;
  if (dir > 0) {
    next = ZOOMS.find((z) => z > zoom + 0.001);
    if (next === undefined) next = 3;
  } else {
    next = [...ZOOMS].reverse().find((z) => z < zoom - 0.001);
    if (next === undefined) next = 0.25;
  }
  setZoom(next);
}

zoomInBtn.addEventListener('click', () => zoomStep(1));
zoomOutBtn.addEventListener('click', () => zoomStep(-1));

window.addEventListener(
  'wheel',
  (e) => {
    if (!reading || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom(zoom * Math.exp(-e.deltaY * 0.0025));
  },
  { passive: false }
);

document.addEventListener('keydown', (e) => {
  if (!reading || !(e.ctrlKey || e.metaKey)) return;
  if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    zoomStep(1);
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault();
    zoomStep(-1);
  } else if (e.key === '0') {
    e.preventDefault();
    setZoom(1);
  }
});

let resizeTimer = null;
window.addEventListener('resize', () => {
  if (!reading) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const bw = computeBaseWidth();
    if (bw !== baseWidth && pageEls.length) {
      baseWidth = bw;
      layoutPages();
    } else {
      renderOverviewLayer();
    }
  }, 150);
});

/* ---------- Overview: every note open and connected to its highlight ---------- */

function isOverview() {
  return reading && settings.overview && pageEls.length > 0 && zoom <= OV_MAX_ZOOM + 0.001;
}

function focusHighlight(h, edit) {
  setZoom(1);
  requestAnimationFrame(() => {
    const pageEl = pageEls[h.page - 1];
    if (!pageEl || !h.rects.length) return;
    const k = Number(pageEl.dataset.scale) / BASE_SCALE || 1;
    const r = h.rects[0];
    const y = pageEl.offsetTop + (r.top + r.height / 2) * k;
    window.scrollTo({ top: y - window.innerHeight * 0.35, behavior: 'auto' });
    setTimeout(() => {
      if (edit) showEditor(h);
      else openHighlight(h);
    }, 60);
  });
}

function renderOverviewLayer() {
  if (!reading) return;
  if (!ovLayer || !ovLayer.isConnected) {
    ovLayer = document.createElement('div');
    ovLayer.className = 'ov-layer';
    pagesEl.appendChild(ovLayer);
  }
  ovLayer.innerHTML = '';

  const active = isOverview();
  document.body.classList.toggle('ov-on', active);
  if (!active) return;

  // Room on each side of the page column
  const first = pageEls[0];
  const pageLeft = first.offsetLeft;
  const pageW = first.offsetWidth;
  const totalW = pagesEl.clientWidth;
  const leftSpace = pageLeft - OV_GAP - 40;
  const rightSpace = totalW - (pageLeft + pageW) - OV_GAP - 40;
  const noteW = Math.min(OV_NOTE_MAX, leftSpace, rightSpace);
  if (noteW < OV_NOTE_MIN) return;

  // Highlights that have a note, in the selected categories, top to bottom
  const items = [];
  highlights.forEach((h) => {
    if (!h.note) return;
    if (!isShown(colorById(h.color).id)) return;
    const pageEl = pageEls[h.page - 1];
    if (!pageEl || !h.rects.length) return;
    const k = Number(pageEl.dataset.scale) / BASE_SCALE || 1;
    const r = h.rects[0];
    items.push({ h, y: pageEl.offsetTop + (r.top + r.height / 2) * k });
  });
  items.sort((a, b) => a.y - b.y);

  // Connector lines live in one SVG under the notes
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ov-svg');
  svg.setAttribute('width', totalW);
  svg.setAttribute('height', pagesEl.offsetHeight);
  ovLayer.appendChild(svg);

  // Build the notes first so their real heights can be measured
  const notes = items.map((it) => {
    const h = it.h;
    const c = colorById(h.color);
    const el = document.createElement('div');
    el.className = 'popover sticky ov-note';
    el.style.width = noteW + 'px';
    el.style.setProperty('--note-bg', c.hex);
    el.style.setProperty('--note-border', strokeOf(c.hex));
    el.style.setProperty('--note-fg', noteFg(c));
    el.innerHTML = `
      <div class="note-body"><div class="sticky-body"></div></div>
      <div class="sticky-foot">
        <button class="del-btn" type="button" title="Delete note" aria-label="Delete note">${binIcon(noteFg(c), c.hex, 14)}</button>
        <button class="edit-btn" type="button">Edit ${ICON_PENCIL}</button>
      </div>`;
    renderNoteText(el.querySelector('.sticky-body'), h.note);
    el.querySelector('.del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      h.note = '';
      commit();
    });
    el.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      focusHighlight(h, true);
    });
    el.addEventListener('click', () => focusHighlight(h, false));
    ovLayer.appendChild(el);
    return { h, el, y: it.y };
  });

  // Each note sits at the height of its highlight; if it would overlap, it moves down
  const lanes = { left: -Infinity, right: -Infinity };
  notes.forEach((n) => {
    n.hgt = n.el.offsetHeight;
    const desired = n.y - n.hgt / 2;
    const tl = Math.max(desired, lanes.left + OV_SPACE);
    const tr = Math.max(desired, lanes.right + OV_SPACE);
    const dl = Math.abs(tl - desired);
    const dr = Math.abs(tr - desired);
    if (dl === dr) n.side = lanes.left <= lanes.right ? 'left' : 'right';
    else n.side = dl < dr ? 'left' : 'right';
    n.top = n.side === 'left' ? tl : tr;
    lanes[n.side] = n.top + n.hgt;
  });

  notes.forEach((n) => {
    const x = n.side === 'left' ? pageLeft - OV_GAP - noteW : pageLeft + pageW + OV_GAP;
    n.el.style.left = x + 'px';
    n.el.style.top = n.top + 'px';

    // line from the note edge to a small circle on the page edge
    const x0 = n.side === 'left' ? x + noteW : x;
    const y0 = Math.min(n.top + n.hgt - 24, Math.max(n.top + 24, n.y));
    const x1 = n.side === 'left' ? pageLeft : pageLeft + pageW;
    const y1 = n.y;
    const xm = (x0 + x1) / 2;

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', `M ${x0} ${y0} C ${xm} ${y0}, ${xm} ${y1}, ${x1} ${y1}`);
    svg.appendChild(path);

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', x1);
    dot.setAttribute('cy', y1);
    dot.setAttribute('r', 7);
    svg.appendChild(dot);
  });
}

function renderOverview() {
  overviewState.textContent = settings.overview ? 'ON' : 'OFF';
  overviewBtn.classList.toggle('is-off', !settings.overview);
  overviewBtn.setAttribute('aria-pressed', String(!!settings.overview));
}

overviewBtn.addEventListener('click', () => {
  settings.overview = !settings.overview;
  saveSettings();
  renderOverview();
  renderOverviewLayer();
  showToast(settings.overview ? 'Zoom out to see all notes' : 'Overview off');
});

renderOverview();

/* ---------- Page thumbnails ---------- */

let thumbsTimer = null;
let thumbsHover = false;

function showThumbs() {
  thumbsEl.classList.add('is-on');
  clearTimeout(thumbsTimer);
  if (!THUMBS_AUTOHIDE || thumbsHover) return;
  thumbsTimer = setTimeout(() => thumbsEl.classList.remove('is-on'), 1900);
}

thumbsEl.addEventListener('mouseenter', () => {
  thumbsHover = true;
  showThumbs();
});
thumbsEl.addEventListener('mouseleave', () => {
  thumbsHover = false;
  showThumbs();
});
document.addEventListener('mousemove', (e) => {
  if (reading && e.clientX < 220) showThumbs();
});

function buildThumbs() {
  thumbsEl.innerHTML = '';
  thumbEls = [];
  thumbIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) renderThumb(e.target);
      });
    },
    { root: thumbsEl, rootMargin: '400px 0px' }
  );

  pageSizes.forEach((sz, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rui-th';
    b.dataset.page = i + 1;
    b.style.height = Math.round(sz.h * (THUMB_W / sz.w)) + 'px';
    b.setAttribute('aria-label', 'Go to page ' + (i + 1));
    const marks = document.createElement('span');
    marks.className = 'rui-marks';
    b.appendChild(marks);
    b.addEventListener('click', () => goToPage(i + 1));
    thumbsEl.appendChild(b);
    thumbEls.push(b);
    thumbIO.observe(b);
  });
  updateThumbMarks();
}

async function renderThumb(btn) {
  if (btn.dataset.done || !pdfDoc) return;
  btn.dataset.done = '1';
  try {
    const n = Number(btn.dataset.page);
    const page = await pdfDoc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: (THUMB_W / base.width) * dpr });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    if (btn.isConnected) btn.insertBefore(canvas, btn.firstChild);
  } catch (err) {
    console.error(err);
  }
}

function goToPage(n) {
  const el = pageEls[n - 1];
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateThumbMarks() {
  if (!thumbEls.length) return;
  const byPage = new Map();
  highlights.forEach((h) => {
    const id = colorById(h.color).id;
    if (!isShown(id)) return;
    const set = byPage.get(h.page) || new Set();
    set.add(id);
    byPage.set(h.page, set);
  });
  thumbEls.forEach((b, i) => {
    const marks = b.querySelector('.rui-marks');
    marks.innerHTML = '';
    const ids = byPage.get(i + 1);
    if (!ids) return;
    ids.forEach((id) => {
      const c = colorById(id);
      const m = document.createElement('i');
      m.style.background = c.hex;
      m.style.boxShadow = `inset 0 0 0 1px ${strokeOf(c.hex)}`;
      marks.appendChild(m);
    });
  });
}

// Which page is in the middle of the window
function updateCurrentPage() {
  if (!pageEls.length) return;
  const mid = window.innerHeight / 2;
  let best = 1;
  let bestD = Infinity;
  for (let i = 0; i < pageEls.length; i++) {
    const r = pageEls[i].getBoundingClientRect();
    const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (d < bestD) {
      bestD = d;
      best = i + 1;
    }
    if (d === 0) break;
  }
  if (best === currentPage && thumbEls[best - 1] && thumbEls[best - 1].classList.contains('is-active')) return;
  currentPage = best;
  thumbEls.forEach((b, i) => b.classList.toggle('is-active', i + 1 === best));
  const t = thumbEls[best - 1];
  if (t) {
    const top = t.offsetTop;
    const bottom = top + t.offsetHeight;
    if (top < thumbsEl.scrollTop) thumbsEl.scrollTop = top - 8;
    else if (bottom > thumbsEl.scrollTop + thumbsEl.clientHeight)
      thumbsEl.scrollTop = bottom - thumbsEl.clientHeight + 8;
  }
}

let scrollQueued = false;
window.addEventListener(
  'scroll',
  () => {
    if (!reading || scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      updateCurrentPage();
      showThumbs();
    });
  },
  { passive: true }
);

/* ---------- Categories menu (top right) ---------- */

function setActive(id) {
  settings.active = id;
  // a new highlight must never land in a hidden category
  if (settings.filter.length && !settings.filter.includes(id)) settings.filter.push(id);
  saveSettings();
}

function toggleCategory(id) {
  const i = settings.filter.indexOf(id);
  if (i >= 0) {
    settings.filter.splice(i, 1);
    if (settings.active === id && settings.filter.length) {
      settings.active = settings.filter[settings.filter.length - 1];
    }
  } else {
    settings.filter.push(id);
    settings.active = id;
  }
  saveSettings();
  renderCats();
  drawHighlights();
}

function clearFilter() {
  settings.filter = [];
  saveSettings();
  renderCats();
  drawHighlights();
}

function removeCategory(id) {
  const c = colorById(id);
  if (
    !confirm(
      `Remove "${labelOf(c)}"? Highlights using it will switch to ${labelOf(DEFAULT_COLORS[0])}.`
    )
  )
    return;
  settings.custom = settings.custom.filter((x) => x.id !== id);
  delete settings.labels[id];
  sanitizeSettings();
  saveSettings();
  renderCats();
  drawHighlights();
}

function startRename(c, labelEl) {
  const input = document.createElement('input');
  input.className = 'rui-in';
  input.value = labelOf(c);
  input.maxLength = 24;
  labelEl.replaceWith(input);
  input.focus();
  input.select();
  let finished = false;
  const finish = (save) => {
    if (finished) return;
    finished = true;
    if (save && input.value.trim()) {
      settings.labels[c.id] = input.value.trim();
      saveSettings();
    }
    renderCats();
  };
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

function renderCats() {
  const sel = settings.filter;
  let text = 'SHOW ALL';
  if (sel.length === 1) text = labelOf(colorById(sel[0]));
  else if (sel.length > 1) text = sel.length + ' SHOWN';
  catsLabel.textContent = 'Categories: ' + text;

  const pen = colorById(settings.active);
  catsPen.style.background = pen.hex;
  catsPen.title = 'New highlights use: ' + labelOf(pen);

  catsMenu.innerHTML = '';

  // SHOW ALL
  const all = document.createElement('div');
  all.className = 'rui-row' + (sel.length === 0 ? ' is-selected' : '');
  all.tabIndex = 0;
  all.setAttribute('role', 'button');
  all.innerHTML = '<span class="rui-row-label">Show all</span>';
  all.addEventListener('click', clearFilter);
  all.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      clearFilter();
    }
  });
  catsMenu.appendChild(all);

  // One row per category
  allColors().forEach((c) => {
    const row = document.createElement('div');
    row.className = 'rui-row' + (sel.includes(c.id) ? ' is-selected' : '');
    row.dataset.id = c.id;
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-pressed', String(sel.includes(c.id)));

    const label = document.createElement('span');
    label.className = 'rui-row-label';
    label.textContent = labelOf(c);
    label.title = 'Double-click to rename';
    label.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startRename(c, label);
    });

    const right = document.createElement('span');
    right.className = 'rui-row-right';
    const count = document.createElement('span');
    count.className = 'rui-count';
    const sq = document.createElement('i');
    sq.className = 'rui-sq';
    sq.style.setProperty('--c', c.hex);
    sq.style.setProperty('--sc', strokeOf(c.hex));
    right.append(count, sq);

    if (settings.custom.some((x) => x.id === c.id)) {
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'rui-x';
      x.textContent = '✕';
      x.title = 'Remove this category';
      x.setAttribute('aria-label', 'Remove ' + labelOf(c));
      x.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCategory(c.id);
      });
      right.appendChild(x);
    }

    row.append(label, right);
    row.addEventListener('click', () => toggleCategory(c.id));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCategory(c.id);
      }
    });
    catsMenu.appendChild(row);
  });

  // CREATE NEW
  const create = document.createElement('div');
  if (!creating) {
    create.className = 'rui-row';
    create.tabIndex = 0;
    create.setAttribute('role', 'button');
    create.innerHTML = '<span class="rui-row-label" style="font-weight:700">Create new</span><span>+</span>';
    const open = () => {
      if (allColors().length >= MAX_COLORS) {
        showToast('Up to ' + MAX_COLORS + ' categories');
        return;
      }
      creating = true;
      renderCats();
      const input = catsMenu.querySelector('.rui-row.is-form .rui-in');
      if (input) input.focus();
    };
    create.addEventListener('click', open);
    create.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  } else {
    create.className = 'rui-row is-form';
    const input = document.createElement('input');
    input.className = 'rui-in';
    input.placeholder = 'Name';
    input.maxLength = 24;
    const pick = document.createElement('input');
    pick.type = 'color';
    pick.className = 'rui-color';
    pick.value = '#ffd6a5';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'rui-add';
    add.textContent = 'Add';
    const submit = () => {
      const c = {
        id: 'c' + Date.now(),
        hex: pick.value,
        label: input.value.trim() || 'New category',
      };
      settings.custom = [...settings.custom, c];
      settings.active = c.id;
      if (settings.filter.length) settings.filter.push(c.id);
      creating = false;
      saveSettings();
      renderCats();
      drawHighlights();
    };
    add.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') {
        creating = false;
        renderCats();
      }
    });
    create.append(input, pick, add);
  }
  catsMenu.appendChild(create);
  updateCatCounts();
}

function updateCatCounts() {
  catsMenu.querySelectorAll('.rui-row[data-id]').forEach((row) => {
    const n = highlights.filter((h) => colorById(h.color).id === row.dataset.id).length;
    const el = row.querySelector('.rui-count');
    if (el) el.textContent = n ? String(n) : '';
  });
}

catsBtn.addEventListener('click', () => {
  const wasClosed = catsMenu.classList.contains('hidden');
  closeMenus();
  if (wasClosed) {
    catsMenu.classList.remove('hidden');
    catsBtn.setAttribute('aria-expanded', 'true');
  }
});

/* ---------- Paper switcher (top center) ---------- */

paperTab.addEventListener('click', async () => {
  const wasClosed = paperMenu.classList.contains('hidden');
  closeMenus();
  if (!wasClosed) return;

  let papers = [];
  try {
    papers = (await dbGetAll('papers')).sort((a, b) => b.openedAt - a.openedAt);
  } catch (err) {
    console.error(err);
  }
  paperMenu.innerHTML = '';
  papers.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rui-pitem' + (currentPaper && p.id === currentPaper.id ? ' is-current' : '');
    b.setAttribute('role', 'option');
    const name = document.createElement('span');
    name.textContent = p.title || cleanTitle(p.name);
    b.append(name);
    b.addEventListener('click', async () => {
      closeMenus();
      if (currentPaper && p.id === currentPaper.id) return;
      await flushSave();
      await openPaper(p.id);
    });
    paperMenu.appendChild(b);
  });
  paperMenu.classList.remove('hidden');
  paperTab.setAttribute('aria-expanded', 'true');
});

function closeMenus() {
  paperMenu.classList.add('hidden');
  paperTab.setAttribute('aria-expanded', 'false');
  catsMenu.classList.add('hidden');
  catsBtn.setAttribute('aria-expanded', 'false');
  if (creating) {
    creating = false;
    renderCats();
  }
}

document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('.rui-cats-wrap') && !e.target.closest('.rui-paper-wrap')) closeMenus();
});

renderCats();

/* ---------- Selecting text: highlight automatically ---------- */

function closestPage(node) {
  const el = node.nodeType === 1 ? node : node.parentElement;
  return el ? el.closest('.page') : null;
}

pagesEl.addEventListener('mouseup', (e) => {
  if (e.altKey) return; // hold Alt to select text without highlighting
  if (isOverview()) return; // pages are tiny in the overview
  if (e.target.closest('.popover') || e.target.closest('.highlight')) return;

  setTimeout(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const startPage = closestPage(range.startContainer);
    const endPage = closestPage(range.endContainer);
    if (!startPage || startPage !== endPage) return;

    const text = sel.toString().trim();
    if (!text) return;

    // Rectangles are stored at the base scale so they follow the zoom
    const k = Number(startPage.dataset.scale) / BASE_SCALE;
    const origin = startPage.getBoundingClientRect();
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 1 && r.height > 1)
      .map((r) => ({
        left: (r.left - origin.left) / k,
        top: (r.top - origin.top) / k,
        width: r.width / k,
        height: r.height / k,
      }));
    if (!rects.length) return;

    const color = colorById(settings.active).id;
    if (settings.filter.length && !settings.filter.includes(color)) {
      settings.filter.push(color);
      saveSettings();
    }

    const h = {
      id: Date.now(),
      page: Number(startPage.dataset.page),
      text,
      rects,
      note: '',
      color,
    };
    highlights.push(h);
    renderCats();
    commit();
    window.getSelection().removeAllRanges();
    showNoteChip(h);
  }, 0);
});

/* ---------- Closing the popover ---------- */

function hidePopover() {
  if (popover) popover.classList.add('hidden');
  setState({ mode: 'hidden', h: null });
  window.getSelection().removeAllRanges();
}

// Clicking elsewhere closes it. If a note is being written, it is saved.
document.addEventListener('mousedown', (e) => {
  if (state.mode === 'hidden') return;
  if (e.target.closest('.popover')) return;

  if (state.mode === 'edit') {
    const ta = popover.querySelector('textarea');
    if (ta) {
      state.h.note = ta.value.trim();
      commit();
    }
  }
  popover.classList.add('hidden');
  setState({ mode: 'hidden', h: null });
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!catsMenu.classList.contains('hidden') || !paperMenu.classList.contains('hidden')) {
    closeMenus();
    return;
  }
  if (state.mode !== 'hidden') hidePopover();
});

/* ---------- Placing the popover (follows the zoom) ---------- */

function placePopoverOld(pageNumber, rect) {
  const pageEl = pageEls[pageNumber - 1];
  if (!pageEl || !popover) return;
  const k = Number(pageEl.dataset.scale) / BASE_SCALE;
  popover.classList.remove('hidden');
  const width = popover.offsetWidth;
  const minLeft = pageEl.offsetLeft + 8;
  const maxLeft = pageEl.offsetLeft + pageEl.clientWidth - width - 8;
  const left = Math.max(minLeft, Math.min(pageEl.offsetLeft + rect.left * k, maxLeft));
  popover.style.left = left + 'px';
  popover.style.top = pageEl.offsetTop + (rect.top + rect.height) * k + 8 + 'px';
}

function lastRect(h) {
  return h.rects[h.rects.length - 1];
}

function applyNoteColors(h) {
  const c = colorById(h.color);
  popover.style.setProperty('--note-bg', c.hex);
  popover.style.setProperty('--note-border', strokeOf(c.hex));
  popover.style.setProperty('--note-fg', noteFg(c));
  return c;
}

/* ---------- Color squares (recolor or remove a highlight) ---------- */

function swatchRow(h, refresh) {
  const row = document.createElement('div');
  row.className = 'sq-row';
  const current = colorById(h.color).id;

  allColors().forEach((c) => {
    const b = document.createElement('button');
    b.className = 'sq' + (c.id === current ? ' current' : '');
    b.style.setProperty('--c', c.hex);
    b.style.setProperty('--stroke', strokeOf(c.hex));
    b.title = labelOf(c);
    b.setAttribute('aria-label', 'Change category to ' + labelOf(c));
    b.onclick = () => {
      h.color = c.id;
      setActive(c.id);
      renderCats();
      commit();
      refresh();
    };
    row.appendChild(b);
  });

  // Slashed square: remove the highlight
  const none = document.createElement('button');
  none.className = 'sq none';
  none.title = 'Remove highlight';
  none.setAttribute('aria-label', 'Remove highlight');
  none.onclick = () => {
    if (h.note && !confirm('Remove this highlight and its note?')) return;
    highlights = highlights.filter((x) => x.id !== h.id);
    renderCats();
    commit();
    hidePopover();
  };
  row.appendChild(none);

  return row;
}

/* ---------- The popover views ---------- */

// Small prompt shown right after highlighting
function showNoteChip(h) {
  setState({ mode: 'chip', h });
  popover.className = 'popover toolbar';
  popover.innerHTML = `
    <button class="chip" data-act="note">+ Add note</button>
    <button class="chip icon" data-act="undo" title="Undo highlight" aria-label="Undo highlight">✕</button>
  `;
  popover.querySelector('[data-act="note"]').onclick = () => showEditor(h);
  popover.querySelector('[data-act="undo"]').onclick = () => {
    highlights = highlights.filter((x) => x.id !== h.id);
    renderCats();
    commit();
    hidePopover();
  };
  placePopover(h.page, lastRect(h));

  chipTimer = setTimeout(() => {
    if (state.mode === 'chip' && state.h === h) hidePopover();
  }, 5000);
}

// Menu when clicking a highlight that has no note
function showHighlightMenu(h) {
  setState({ mode: 'menu', h });
  popover.className = 'popover toolbar';
  popover.innerHTML = `
    <button class="chip" data-act="add">Add note</button>
    <button class="chip danger" data-act="remove">Remove highlight</button>
  `;
  popover.prepend(swatchRow(h, () => showHighlightMenu(h)));

  popover.querySelector('[data-act="add"]').onclick = () => showEditor(h);
  popover.querySelector('[data-act="remove"]').onclick = () => {
    highlights = highlights.filter((x) => x.id !== h.id);
    renderCats();
    commit();
    hidePopover();
  };
  placePopover(h.page, lastRect(h));
}

// Sticky note view
function showNote(h) {
  setState({ mode: 'note', h });
  popover.className = 'popover sticky';
  const c = applyNoteColors(h);
  popover.innerHTML = `
    <div class="note-strip"></div>
    <div class="note-body"><div class="sticky-body"></div></div>
    <div class="sticky-foot">
      <button class="del-btn" data-act="delete" title="Delete note" aria-label="Delete note">${binIcon(noteFg(c), c.hex, 14)}</button>
      <span class="foot-right"><button class="copy-btn" data-act="copy" type="button">Copy ${ICON_COPY}</button><button class="edit-btn" data-act="edit">Edit ${ICON_PENCIL}</button></span>
    </div>
  `;
  popover.querySelector('.note-strip').append(swatchRow(h, () => showNote(h)));
  renderNoteText(popover.querySelector('.sticky-body'), h.note);

  popover.querySelector('[data-act="edit"]').onclick = () => showEditor(h);
  popover.querySelector('[data-act="delete"]').onclick = () => {
    h.note = '';
    commit();
    hidePopover();
  };
  placePopover(h.page, lastRect(h));
}

// Writing or editing a note (draft keeps unsaved text when recoloring)
function showEditor(h, draft) {
  setState({ mode: 'edit', h });
  popover.className = 'popover sticky';
  const c = applyNoteColors(h);
  popover.innerHTML = `
    <div class="note-strip"></div>
    <div class="note-body"><textarea placeholder="Type..."></textarea></div>
    <div class="sticky-foot">
      <div class="foot-actions"><button class="save-btn" data-act="save">Save</button><button class="cancel-btn" data-act="cancel">Cancel</button></div>
      <button class="del-btn" data-act="delete" title="Delete note" aria-label="Delete note">${binIcon(noteFg(c), c.hex, 14)}</button>
    </div>
  `;

  const ta = popover.querySelector('textarea');
  ta.value = draft !== undefined ? draft : h.note;

  popover
    .querySelector('.note-strip')
    .append(swatchRow(h, () => showEditor(h, popover.querySelector('textarea').value)));

  const grow = () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, window.innerHeight * 0.4) + 'px';
  };
  const save = () => {
    h.note = ta.value.trim();
    commit();
    if (h.note) showNote(h);
    else hidePopover();
  };

  ta.addEventListener('input', grow);
  ta.onkeydown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
  };
  popover.querySelector('[data-act="save"]').onclick = save;
  popover.querySelector('[data-act="cancel"]').onclick = () => {
    if (h.note) showNote(h);
    else hidePopover();
  };
  popover.querySelector('[data-act="delete"]').onclick = () => {
    h.note = '';
    commit();
    hidePopover();
  };

  placePopover(h.page, lastRect(h));
  grow();
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(ta.value.length, ta.value.length);
  popover.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function openHighlight(h) {
  if (h.note) showNote(h);
  else showHighlightMenu(h);
}

/* ---------- Note text with clickable links ---------- */

function renderNoteText(container, text) {
  const re = /(https?:\/\/\S+|\bwww\.\S+)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const url = m[0].replace(/[.,;:!?)"'\]]+$/, '');
    if (m.index > last) container.append(text.slice(last, m.index));

    const a = document.createElement('a');
    a.href = url.startsWith('http') ? url : 'https://' + url;
    a.textContent = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    container.append(a);

    last = m.index + url.length;
  }
  if (last < text.length) container.append(text.slice(last));
}

/* ---------- Drawing highlights (only the selected categories) ---------- */

function drawHighlights() {
  pageEls.forEach((pageEl) => {
    const layer = pageEl.querySelector('.highlightLayer');
    if (!layer) return;
    layer.innerHTML = '';
    const pageNumber = Number(pageEl.dataset.page);
    const k = Number(pageEl.dataset.scale) / BASE_SCALE || 1;

    highlights
      .filter((h) => h.page === pageNumber)
      .forEach((h) => {
        const c = colorById(h.color);
        if (!isShown(c.id)) return;

        h.rects.forEach((r) => {
          const el = document.createElement('div');
          el.className = 'highlight';
          el.style.left = r.left * k + 'px';
          el.style.top = r.top * k + 'px';
          el.style.width = r.width * k + 'px';
          el.style.height = r.height * k + 'px';
          el.style.background = c.hex;
          el.addEventListener('click', () => {
            if (isOverview()) focusHighlight(h, false);
            else openHighlight(h);
          });
          layer.appendChild(el);
        });
      });
  });
  updateThumbMarks();
  updateCatCounts();
  renderOverviewLayer();
}

/* ---------- Start ---------- */

setView('library');
refreshLibrary();

// Loads the 500 and 700 weights of Geist Mono used by the reader controls
(() => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@500;700&display=swap';
  document.head.appendChild(link);
})();
/* ---------- Sticky notes sit on the page edge: about 40% on the paper, 60% outside ---------- */

const NOTE_INSIDE = 0.4; // share of the note that sits on the paper (0.4 = 40%)

function placePopoverV2(pageNumber, rect) {
  // the small chip and color menu keep the old placement
  if (!popover || !popover.classList.contains('sticky')) {
    placePopoverOld(pageNumber, rect);
    return;
  }
  const pageEl = pageEls[pageNumber - 1];
  if (!pageEl) return;

  const k = Number(pageEl.dataset.scale) / BASE_SCALE;
  popover.classList.remove('hidden');
  const width = popover.offsetWidth;

  const pageLeft = pageEl.offsetLeft;
  const pageRight = pageLeft + pageEl.offsetWidth;

  // left half of the page: note goes on the left edge. Right half: on the right edge.
  const middle = (rect.left + rect.width / 2) * k;
  const onLeftHalf = middle < pageEl.offsetWidth / 2;

  let left = onLeftHalf ? pageLeft + width * NOTE_INSIDE - width : pageRight - width * NOTE_INSIDE;
  left = Math.max(8, left); // never cut off by the left edge of the window

  popover.style.left = left + 'px';
  popover.style.top = pageEl.offsetTop + (rect.top + rect.height) * k + 8 + 'px';
}
window.__refreshLibrary = refreshLibrary;
/* ---------- Sticky notes stay on screen: 100px from the window edge when zoomed in ---------- */

const NOTE_EDGE = 100; // pixels kept free at the left and right of the window when zoomed in

function placePopover(pageNumber, rect) {
  placePopoverV2(pageNumber, rect);
  if (!popover || !popover.classList.contains('sticky')) return;

  const edge = zoom > 1.001 ? NOTE_EDGE : 8;
  const width = popover.offsetWidth;
  const view = document.documentElement.clientWidth;
  const minLeft = window.scrollX + edge;
  const maxLeft = window.scrollX + view - edge - width;

  let left = parseFloat(popover.style.left) || 0;
  left = Math.min(left, maxLeft);
  left = Math.max(left, minLeft); // in a very narrow window the left side wins
  popover.style.left = left + 'px';
}
window.__openPaper = openPaper;
window.__jumpTo = (id) => {
  const h = highlights.find((x) => x.id === id);
  if (h) focusHighlight(h, false);
};
/* ---------- Copy button inside a saved note ---------- */

// What the button copies: 'both' = passage + note, 'text' = passage only, 'note' = note only
const COPY_MODE = 'both';

const ICON_COPY = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 8V3h13v13h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/><rect x="3" y="8" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>`;

function noteCopyText(h) {
  const passage = (h.text || '').replace(/\s+/g, ' ').trim();
  const note = (h.note || '').trim();
  if (COPY_MODE === 'text') return passage;
  if (COPY_MODE === 'note') return note;
  return '\u201C' + passage + '\u201D' + (note ? '\nMy note: ' + note : '');
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // older browsers: copy through a hidden text box
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      /* ignore */
    }
    ta.remove();
    return ok;
  }
}

pagesEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn || !state.h) return;
  const ok = await copyToClipboard(noteCopyText(state.h));
  btn.innerHTML = (ok ? 'Copied ' : 'Could not copy ') + (ok ? ICON_CHECK : '');
  setTimeout(() => {
    if (btn.isConnected) btn.innerHTML = 'Copy ' + ICON_COPY;
  }, 1300);
});
/* ---------- Selecting text: highlight at once, but forgiving ---------- */

let lastAuto = null; // { h, text }: the newest highlight made by selecting

// What is selected right now (rectangles are stored at the base scale so they follow the zoom)
function getSelectionData() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const startPage = closestPage(range.startContainer);
  const endPage = closestPage(range.endContainer);
  if (!startPage || startPage !== endPage) return null;
  const text = sel.toString().trim();
  if (!text) return null;

  const k = Number(startPage.dataset.scale) / BASE_SCALE;
  const origin = startPage.getBoundingClientRect();
  const rects = Array.from(range.getClientRects())
    .filter((r) => r.width > 1 && r.height > 1)
    .map((r) => ({
      left: (r.left - origin.left) / k,
      top: (r.top - origin.top) / k,
      width: r.width / k,
      height: r.height / k,
    }));
  if (!rects.length) return null;
  return { page: Number(startPage.dataset.page), text, rects };
}

/* The "Keep it" message */
const undoBar = document.createElement('div');
undoBar.className = 'undobar hidden';
undoBar.innerHTML = '<span>Copied. Highlight removed.</span><button type="button">Keep it</button>';
document.body.appendChild(undoBar);

let undoTimer = null;
let undoItem = null; // { h, paperId }

function showUndo(h) {
  undoItem = { h, paperId: currentPaper ? currentPaper.id : null };
  undoBar.classList.remove('hidden');
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    undoBar.classList.add('hidden');
    undoItem = null;
  }, 4000);
}

undoBar.querySelector('button').addEventListener('click', () => {
  if (undoItem && currentPaper && currentPaper.id === undoItem.paperId && !highlights.includes(undoItem.h)) {
    highlights.push(undoItem.h);
    renderCats();
    commit();
  }
  undoItem = null;
  undoBar.classList.add('hidden');
});

function dropAutoHighlight(h) {
  highlights = highlights.filter((x) => x.id !== h.id);
  renderCats();
  commit();
  if (state.mode === 'chip' && state.h === h) {
    popover.classList.add('hidden');
    setState({ mode: 'hidden', h: null });
  }
  lastAuto = null;
  showUndo(h);
}

// Ctrl+C (or Copy in the right-click menu) while the selection is the newest highlight
document.addEventListener('copy', () => {
  if (!lastAuto) return;
  const { h, text } = lastAuto;
  if (h.note || !highlights.includes(h)) {
    lastAuto = null;
    return;
  }
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  if (sel.toString().trim() !== text) return;
  dropAutoHighlight(h);
});

// A Copy button in the small chip, and a longer life for the selection
function addChipCopy(h) {
  if (!popover || state.mode !== 'chip' || state.h !== h) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip';
  btn.dataset.act = 'copy';
  btn.textContent = 'Copy';
  btn.addEventListener('click', async () => {
    await copyToClipboard(h.text);
    if (!h.note && highlights.includes(h)) dropAutoHighlight(h);
  });
  popover.insertBefore(btn, popover.querySelector('[data-act="undo"]'));
  placePopover(h.page, lastRect(h));

  // the old code cleared the selection when the chip faded; this only hides the chip
  clearTimeout(chipTimer);
  chipTimer = setTimeout(() => {
    if (state.mode === 'chip' && state.h === h) {
      popover.classList.add('hidden');
      setState({ mode: 'hidden', h: null });
    }
  }, 6000);
}

// This listener runs before the old one and stops it
pagesEl.addEventListener(
  'mouseup',
  (e) => {
    if (e.altKey) return; // Alt / Option: select without highlighting
    if (isOverview()) return;
    if (e.target.closest('.popover') || e.target.closest('.highlight')) return;
    e.stopImmediatePropagation();
    if (e.button !== 0) return;

    setTimeout(() => {
      const d = getSelectionData();
      if (!d) return;

      // the selection was stretched over the last highlight: replace that one
      if (lastAuto && !lastAuto.h.note && highlights.includes(lastAuto.h) && d.text.includes(lastAuto.text)) {
        highlights = highlights.filter((x) => x.id !== lastAuto.h.id);
      }

      const color = colorById(settings.active).id;
      if (settings.filter.length && !settings.filter.includes(color)) {
        settings.filter.push(color);
        saveSettings();
      }
      const h = { id: Date.now(), page: d.page, text: d.text, rects: d.rects, note: '', color };
      highlights.push(h);
      renderCats();
      commit();
      lastAuto = { h, text: d.text }; // the selection is NOT cleared
      showNoteChip(h);
      addChipCopy(h);
    }, 0);
  },
  true
);

/* ---------- Page previews: move them below the notes (see reader.css) ---------- */
document.body.appendChild(thumbsEl);