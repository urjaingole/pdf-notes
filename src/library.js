import './library.css';

/* The library page when it has papers:
   - papers in a 3-column grid, the add card in the 4th slot of the first row
   - the texts below
   - warnings when the library is nearly full
   - one search for titles, notes and highlights across all papers */

// Words on the library page: change them here
const TEXT = {
  eyebrow: 'My library',
  title: 'Pick up where you left off.\nYour papers and notes live here.',
  sub: 'Add a PDF from your computer.',
  add: '[Add PDF]',
  addFull: '[Library full]',
  limit: (max) => max + ' papers max',
  near: (left, max) => left + ' left of ' + max,
  full: (used, max) => 'Full: ' + used + ' of ' + max,
  nearMsg: (left) =>
    'Only ' + left + (left === 1 ? ' space' : ' spaces') + ' left. Delete a paper to make room.',
  fullMsg: (max) => 'Your library is full (' + max + ' papers). Delete one to add another.',
  searchPlaceholder: 'Search papers, notes, highlights',
  searchLabel: 'Search all papers',
  searchEmpty: 'No matches. Try a shorter word.',
};

const MAX_RESULTS = 30;

const root = document.documentElement;
const list = document.getElementById('lib-list');
const head = document.querySelector('.lib-head');
const eyebrow = document.querySelector('.lib-eyebrow');
const titleEl = document.getElementById('title-text');
const countEl = document.getElementById('lib-count');
const fileInput = document.getElementById('file-input');

let usage = { used: 0, max: Infinity, left: Infinity, near: false, full: false };
let lastNoted = null;
let msgTimer = null;

/* ---------- Messages ---------- */

function showMsg(text) {
  const el = document.getElementById('lib-msg');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => el.classList.add('hidden'), 8000);
}

/* ---------- The add card ---------- */

function makeAddCard() {
  const card = document.createElement('label');
  card.className = 'upload-card';
  card.htmlFor = 'file-input';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', 'Add a PDF from your computer');
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('span');
    s.textContent = TEXT.add;
    s.setAttribute('aria-hidden', 'true');
    card.appendChild(s);
  }
  card.addEventListener('click', (e) => {
    if (usage.full) {
      e.preventDefault();
      showMsg(TEXT.fullMsg(usage.max));
    }
  });
  card.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (usage.full) showMsg(TEXT.fullMsg(usage.max));
    else if (fileInput) fileInput.click();
  });
  return card;
}

function updateAddCard() {
  const up = list && list.querySelector(':scope > .upload-card');
  if (!up) return;
  up.classList.toggle('is-full', usage.full);
  up.setAttribute('aria-disabled', String(usage.full));
  up.querySelectorAll('span').forEach((s) => {
    s.textContent = usage.full ? TEXT.addFull : TEXT.add;
  });
}

/* ---------- Search ---------- */

const SEARCH_ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.75" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.2 10.2L14.5 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/></svg>';

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

async function loadPapers() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction('papers').objectStore('papers').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function buildSearch() {
  const box = document.createElement('div');
  box.className = 'lib-search';
  box.innerHTML = `
    <div class="ls-bar">
      <button class="ls-btn" type="button" aria-label="${TEXT.searchLabel}">${SEARCH_ICON}</button>
      <input class="ls-input" type="text" placeholder="${TEXT.searchPlaceholder}"
        aria-label="${TEXT.searchLabel}" autocomplete="off" spellcheck="false" />
    </div>
    <div class="ls-results" role="listbox" hidden></div>`;

  const btn = box.querySelector('.ls-btn');
  const input = box.querySelector('.ls-input');
  const results = box.querySelector('.ls-results');

  let papers = [];
  let found = [];
  let sel = 0;
  let tokens = [];
  let timer = null;

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // text with the matched words in bold
  function withBold(parent, text) {
    if (!tokens.length) {
      parent.textContent = text;
      return;
    }
    const re = new RegExp('(' + tokens.map(esc).join('|') + ')', 'gi');
    text.split(re).forEach((part, i) => {
      if (!part) return;
      if (i % 2 === 1) {
        const b = document.createElement('b');
        b.textContent = part;
        parent.appendChild(b);
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  // a short piece of text around the first match
  function snippet(text) {
    const low = text.toLowerCase();
    let at = -1;
    tokens.forEach((t) => {
      const i = low.indexOf(t);
      if (i >= 0 && (at < 0 || i < at)) at = i;
    });
    const start = Math.max(0, at - 40);
    const cut = text.slice(start, start + 140);
    return (start > 0 ? '\u2026' : '') + cut + (start + 140 < text.length ? '\u2026' : '');
  }

  function search(q) {
    tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return null;
    const all = (t) => tokens.every((k) => t.includes(k));
    const byPaper = [];
    const byNote = [];
    const byText = [];
    papers.forEach((p) => {
      const title = p.title || p.name || 'Untitled paper';
      const hl = p.highlights || [];
      if (all(title.toLowerCase())) {
        const n = hl.filter((h) => h.note).length;
        byPaper.push({
          kind: 'paper',
          paperId: p.id,
          text: title,
          meta: 'Paper \u00B7 ' + n + (n === 1 ? ' note' : ' notes'),
        });
      }
      hl.forEach((h) => {
        if (h.note && all(h.note.toLowerCase())) {
          byNote.push({
            kind: 'note',
            paperId: p.id,
            hid: h.id,
            color: h.color,
            text: snippet(h.note),
            meta: 'Note \u00B7 ' + title,
          });
        } else if (h.text && all(h.text.toLowerCase())) {
          byText.push({
            kind: 'hl',
            paperId: p.id,
            hid: h.id,
            color: h.color,
            text: snippet(h.text),
            meta: 'Highlight \u00B7 ' + title,
          });
        }
      });
    });
    return [...byPaper, ...byNote, ...byText];
  }

  function setSel(i) {
    sel = i;
    results.querySelectorAll('.ls-row').forEach((row, n) => {
      row.classList.toggle('is-sel', n === sel);
      if (n === sel) row.scrollIntoView({ block: 'nearest' });
    });
  }

  function render() {
    const all = search(input.value);
    results.innerHTML = '';
    if (all === null) {
      found = [];
      results.hidden = true;
      return;
    }
    results.hidden = false;
    found = all.slice(0, MAX_RESULTS);
    if (!found.length) {
      const d = document.createElement('div');
      d.className = 'ls-empty';
      d.textContent = TEXT.searchEmpty;
      results.appendChild(d);
      return;
    }
    found.forEach((r, i) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ls-row';
      row.setAttribute('role', 'option');
      const main = document.createElement('div');
      main.className = 'ls-main';
      if (r.color) {
        const sq = document.createElement('i');
        sq.style.background = hexOf(r.color);
        main.appendChild(sq);
      }
      const span = document.createElement('span');
      withBold(span, r.text);
      main.appendChild(span);
      const meta = document.createElement('div');
      meta.className = 'ls-meta';
      meta.textContent = r.meta;
      row.append(main, meta);
      row.addEventListener('mousemove', () => {
        if (sel !== i) setSel(i);
      });
      row.addEventListener('click', () => choose(r));
      results.appendChild(row);
    });
    if (all.length > found.length) {
      const m = document.createElement('div');
      m.className = 'ls-more';
      m.textContent = '+' + (all.length - found.length) + ' more. Keep typing to narrow it down.';
      results.appendChild(m);
    }
    setSel(0);
  }

  async function choose(r) {
    close();
    if (typeof window.__openPaper !== 'function') return;
    await window.__openPaper(r.paperId);
    if (r.hid && typeof window.__jumpTo === 'function') {
      setTimeout(() => window.__jumpTo(r.hid), 200);
    }
  }

  async function open() {
    box.classList.add('is-open');
    input.focus();
    try {
      papers = await loadPapers();
    } catch (e) {
      papers = [];
    }
    render();
  }

  function close() {
    box.classList.remove('is-open');
    results.hidden = true;
    results.innerHTML = '';
    input.value = '';
  }

  btn.addEventListener('click', () => {
    if (box.classList.contains('is-open')) close();
    else open();
  });

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (found.length) setSel(Math.min(sel + 1, found.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (found.length) setSel(Math.max(sel - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (found[sel]) choose(found[sel]);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (box.classList.contains('is-open') && !box.contains(e.target)) close();
  });

  // press / anywhere in the library to search
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!root.classList.contains('lib-new')) return;
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    e.preventDefault();
    open();
  });

  return box;
}

/* ---------- Start ---------- */

if (list && head) {
  const originalEyebrow = eyebrow ? eyebrow.textContent : '';

  const sub = document.createElement('p');
  sub.className = 'lib-sub';
  sub.textContent = TEXT.sub;
  head.appendChild(sub);
  head.appendChild(buildSearch());

  const hasPapers = () => list.querySelector(':scope > .paper-card') !== null;

  const setTitle = () => {
    if (!titleEl) return;
    if (hasPapers()) {
      titleEl.style.whiteSpace = 'pre-line'; // lets the line break in the title work
      if (titleEl.textContent !== TEXT.title) titleEl.textContent = TEXT.title;
    } else {
      titleEl.style.whiteSpace = '';
    }
  };

  const sync = () => {
    const cards = Array.from(list.querySelectorAll(':scope > .paper-card'));
    const reading = document.body.classList.contains('reading');
    root.classList.toggle('lib-new', cards.length > 0 && !reading);
    if (eyebrow) eyebrow.textContent = cards.length ? TEXT.eyebrow : originalEyebrow;
    setTitle();

    let up = list.querySelector(':scope > .upload-card');
    if (!cards.length) {
      if (up) up.remove();
      return;
    }
    if (!up) {
      up = makeAddCard();
      list.appendChild(up);
      updateAddCard();
    }

    // papers: 3 per row. Add card: right after the last paper of row 1, never past the 4th slot.
    cards.forEach((c, i) => {
      c.style.gridRow = String(Math.floor(i / 3) + 1);
      c.style.gridColumn = String((i % 3) + 1);
    });
    up.style.gridRow = '1';
    up.style.gridColumn = String(Math.min(cards.length, 3) + 1);
  };

  // main.js writes "3 OF 20 PAPERS". We turn that into the limit note and warnings.
  const fixCount = () => {
    if (!countEl) return;
    const m = /(\d+)\s+OF\s+(\d+)\s+PAPERS/i.exec(countEl.textContent);
    if (!m) return;
    const used = Number(m[1]);
    const max = Number(m[2]);
    const left = max - used;
    const full = left <= 0;
    const near = !full && left <= Math.max(3, Math.ceil(max * 0.1)); // 10% left, at least 3
    usage = { used, max, left, near, full };

    countEl.textContent = full ? TEXT.full(used, max) : near ? TEXT.near(left, max) : TEXT.limit(max);
    const info = countEl.closest('.band-info');
    if (info) {
      info.classList.toggle('is-near', near);
      info.classList.toggle('is-full', full);
    }
    updateAddCard();

    // one message each time the situation changes
    const key = full ? 'full' : near ? 'near' + left : null;
    if (key && key !== lastNoted && !document.body.classList.contains('reading')) {
      showMsg(full ? TEXT.fullMsg(max) : TEXT.nearMsg(left));
    }
    lastNoted = key;
  };

  new MutationObserver(sync).observe(list, { childList: true });
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if (titleEl) {
    new MutationObserver(setTitle).observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
  if (countEl) {
    new MutationObserver(fixCount).observe(countEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
  sync();
  fixCount();
}