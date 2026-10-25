import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './preview.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/* Preview window on the library page: hover or click "View preview" on a paper card */

const BASE_SCALE = 1.4; // highlights are stored at this scale (same as the reader)
const SHOW_DELAY = 120; // ms of hovering before the preview opens
const HIDE_DELAY = 250; // ms after leaving before it closes (a click keeps it open)

const TEXT = {
  view: 'View preview',
  open: 'Open',
  close: 'Close',
  loading: 'Loading preview',
  error: "Couldn't open this preview.",
};

const DEFAULT_HEX = { blue: '#B2E0FF', mint: '#A6F5DD', green: '#B9FFB1', pink: '#FFCBCC' };

function hexOf(id) {
  if (DEFAULT_HEX[id]) return DEFAULT_HEX[id];
  try {
    const s = JSON.parse(localStorage.getItem('pdfnotes.settings') || '{}');
    const c = (s.custom || []).find((x) => x.id === id);
    if (c) return c.hex;
  } catch (e) {
    /* ignore */
  }
  return DEFAULT_HEX.blue;
}

/* ---------- Saved papers ---------- */

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pdfnotes', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('papers')) db.createObjectStore('papers', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(store, id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(store) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/* ---------- The window and its two layers ---------- */

const root = document.documentElement;
const list = document.getElementById('lib-list');

const win = document.createElement('div');
win.className = 'pv';
win.innerHTML = `
  <div class="pv-bar">
    <button type="button" class="pv-open">${TEXT.open}</button>
    <button type="button" class="pv-close">${TEXT.close}</button>
  </div>
  <div class="pv-frame"><div class="pv-scroll"></div></div>`;
document.body.appendChild(win);

// Under the stripe, in Figma's order: the blur first, then the green Color blend on the blurred page
const blurLayer = document.createElement('div');
blurLayer.className = 'pv-layer pv-blur';
const tint = document.createElement('div');
tint.className = 'pv-layer pv-tint';
document.body.insertBefore(blurLayer, win);
document.body.insertBefore(tint, win);

const layers = [win, blurLayer, tint];
const setOpen = (on) => layers.forEach((el) => el.classList.toggle('is-open', on));
const setSide = (right) =>
  layers.forEach((el) => {
    el.classList.toggle('pv--right', right);
    el.classList.toggle('pv--left', !right);
  });

const scroll = win.querySelector('.pv-scroll');

let currentCard = null;
let currentId = null;
let pdfDoc = null;
let pageObserver = null;
let loadToken = 0;
let pinned = false; // opened by a click: stays open until closed
let overWin = false;
let showTimer = null;
let hideTimer = null;

function cleanup() {
  loadToken++;
  if (pageObserver) {
    pageObserver.disconnect();
    pageObserver = null;
  }
  if (pdfDoc) {
    try {
      pdfDoc.destroy();
    } catch (e) {
      /* ignore */
    }
    pdfDoc = null;
  }
  scroll.innerHTML = '';
}

function hide() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  setOpen(false);
  list.querySelectorAll('.pv-btn.is-on').forEach((b) => b.classList.remove('is-on'));
  pinned = false;
  overWin = false;
  currentCard = null;
  currentId = null;
  loadToken++; // stops anything still loading
  setTimeout(() => {
    if (!currentId) cleanup();
  }, 220);
}

function scheduleHide() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (!pinned && !overWin) hide();
  }, HIDE_DELAY);
}

async function paperIdOf(card) {
  if (card.dataset.id) return card.dataset.id;
  // fallback: same order as the library (newest opened first)
  const cards = Array.from(list.querySelectorAll(':scope > .paper-card'));
  const papers = (await dbGetAll('papers')).sort((a, b) => b.openedAt - a.openedAt);
  const p = papers[cards.indexOf(card)];
  return p ? p.id : null;
}

async function renderPage(el, meta, token) {
  if (el.dataset.done || !pdfDoc) return;
  el.dataset.done = '1';
  try {
    const n = Number(el.dataset.page);
    const page = await pdfDoc.getPage(n);
    if (token !== loadToken) return;
    const base = page.getViewport({ scale: 1 });
    const width = el.clientWidth || 600;
    const scale = width / base.width;
    const viewport = page.getViewport({ scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
    }).promise;
    if (token !== loadToken) return;

    el.style.aspectRatio = base.width + ' / ' + base.height;
    el.appendChild(canvas);

    // the highlights, in their category colors
    const k = scale / BASE_SCALE;
    (meta.highlights || [])
      .filter((h) => h.page === n)
      .forEach((h) => {
        h.rects.forEach((r) => {
          const d = document.createElement('div');
          d.className = 'pv-hl';
          d.style.left = r.left * k + 'px';
          d.style.top = r.top * k + 'px';
          d.style.width = r.width * k + 'px';
          d.style.height = r.height * k + 'px';
          d.style.background = hexOf(h.color);
          el.appendChild(d);
        });
      });
  } catch (err) {
    console.error(err);
  }
}

async function show(card) {
  if (!root.classList.contains('lib-new')) return;
  clearTimeout(hideTimer);
  const id = await paperIdOf(card);
  if (!id) return;
  if (id === currentId && win.classList.contains('is-open')) return;

  cleanup();
  const token = ++loadToken;
  currentCard = card;
  currentId = id;

  // over columns 3 and 4, unless the card itself is in column 3 or further right
  const col = parseInt(card.style.gridColumn, 10) || 1;
  setSide(col <= 2);

  list.querySelectorAll('.pv-btn.is-on').forEach((b) => b.classList.remove('is-on'));
  const btn = card.querySelector(':scope > .pv-btn');
  if (btn) btn.classList.add('is-on');

  setOpen(true);
  scroll.innerHTML = '<p class="pv-status">' + TEXT.loading + '</p>';
  scroll.scrollTop = 0;

  try {
    const [meta, rec] = await Promise.all([dbGet('papers', id), dbGet('files', id)]);
    if (token !== loadToken) return;
    if (!meta || !rec) throw new Error('Paper not found');

    const pdf = await pdfjsLib.getDocument({ data: await rec.blob.arrayBuffer() }).promise;
    if (token !== loadToken) {
      pdf.destroy();
      return;
    }
    pdfDoc = pdf;

    const first = await pdf.getPage(1);
    if (token !== loadToken) return;
    const vp = first.getViewport({ scale: 1 });

    scroll.innerHTML = '';
    pageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) renderPage(en.target, meta, token);
        });
      },
      { root: scroll, rootMargin: '900px 0px' }
    );
    for (let n = 1; n <= pdf.numPages; n++) {
      const el = document.createElement('div');
      el.className = 'pv-page';
      el.dataset.page = String(n);
      el.style.aspectRatio = vp.width + ' / ' + vp.height;
      scroll.appendChild(el);
      pageObserver.observe(el);
    }
  } catch (err) {
    if (token !== loadToken) return;
    console.error(err);
    scroll.innerHTML = '<p class="pv-status">' + TEXT.error + '</p>';
  }
}

/* ---------- The label on each card ---------- */

function attach(card) {
  if (card.querySelector(':scope > .pv-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pv-btn';
  btn.textContent = TEXT.view;
  btn.setAttribute('aria-label', 'View preview of this paper');

  btn.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    showTimer = setTimeout(() => show(card), SHOW_DELAY);
  });
  btn.addEventListener('mouseleave', () => {
    clearTimeout(showTimer);
    scheduleHide();
  });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (pinned && currentCard === card) {
      hide();
      return;
    }
    pinned = true;
    show(card);
  });
  card.appendChild(btn);
}

win.addEventListener('mouseenter', () => {
  overWin = true;
  clearTimeout(hideTimer);
});
win.addEventListener('mouseleave', () => {
  overWin = false;
  scheduleHide();
});

win.querySelector('.pv-close').addEventListener('click', hide);
win.querySelector('.pv-open').addEventListener('click', () => {
  const card = currentCard;
  hide();
  const open = card && card.querySelector(':scope > .paper-open');
  if (open) open.click();
});

document.addEventListener('mousedown', (e) => {
  if (!win.classList.contains('is-open') || !pinned) return;
  if (win.contains(e.target) || e.target.closest('.pv-btn')) return;
  hide();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && win.classList.contains('is-open')) hide();
});

/* ---------- Keep the labels up to date ---------- */

if (list) {
  const sync = () => {
    list.querySelectorAll(':scope > .paper-card').forEach(attach);
    if (currentCard && !currentCard.isConnected) hide();
  };
  new MutationObserver(sync).observe(list, { childList: true });
  sync();
}

// opening a paper closes the preview
new MutationObserver(() => {
  if (document.body.classList.contains('reading') && win.classList.contains('is-open')) hide();
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });