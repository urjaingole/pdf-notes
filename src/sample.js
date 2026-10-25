// Adds a sample paper (with highlights and notes already on it) to the library.

const SAMPLE_ID = 'sample-welcome';
const SEEDED_KEY = 'pdfnotes.sampleSeeded';

const SAMPLE_HIGHLIGHTS = [
  {
    id: 9000001,
    page: 1,
    text: 'A highlight without a reason is only a colored line',
    rects: [{ left: 281.27, top: 314.82, width: 309.23, height: 15.4 }],
    note: 'This is a sticky note. It is pinned to the highlight, so the reason stays with the idea. Click any highlight to open its note, or press Edit to change it.',
    color: 'blue',
  },
  {
    id: 9000002,
    page: 1,
    text: 'In 1945 Vannevar Bush imagined a desk called the memex',
    rects: [{ left: 354.85, top: 454.82, width: 363.07, height: 15.4 }],
    note: 'People and years have their own color. Open CATEGORIES at the top right to show only this color. Double-click a name there to rename it.',
    color: 'pink',
  },
  {
    id: 9000003,
    page: 2,
    text: 'Readers have always written in the margins.',
    rects: [{ left: 100.8, top: 136.32, width: 272.41, height: 15.4 }],
    note: 'Links are mint. Web addresses in a note are clickable: https://en.wikipedia.org/wiki/Marginalia',
    color: 'mint',
  },
  {
    id: 9000004,
    page: 2,
    text: 'marginalia: notes written beside a text',
    rects: [
      { left: 502.38, top: 136.32, width: 207.83, height: 15.4 },
      { left: 100.8, top: 159.42, width: 23.09, height: 15.4 },
    ],
    note: 'Definitions are green. Keep a short meaning here so you do not have to look it up again.',
    color: 'green',
  },
];

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

const wrap = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

async function addSample() {
  const db = await openDb();
  const existing = await wrap(db.transaction('papers').objectStore('papers').get(SAMPLE_ID));
  if (!existing) {
    const res = await fetch(new URL('sample.pdf', location.href));
    if (!res.ok) throw new Error('sample.pdf was not found');
    const blob = new Blob([await res.arrayBuffer()], { type: 'application/pdf' });
    const now = Date.now();
    await wrap(db.transaction('files', 'readwrite').objectStore('files').put({ id: SAMPLE_ID, blob }));
    await wrap(
      db.transaction('papers', 'readwrite').objectStore('papers').put({
        id: SAMPLE_ID,
        name: 'why-a-highlight-needs-a-reason',
        title: 'Why a Highlight Needs a Reason',
        titleChecked: true,
        size: blob.size,
        addedAt: now,
        openedAt: now,
        highlights: JSON.parse(JSON.stringify(SAMPLE_HIGHLIGHTS)),
        sample: true,
      })
    );
  }
  if (window.__refreshLibrary) window.__refreshLibrary();
}

// First run in the extension: an empty library gets the sample paper.
// The website keeps its landing page instead.
async function seedOnFirstRun() {
  if (!window.__EXTENSION__) return;
  try {
    if (localStorage.getItem(SEEDED_KEY)) return;
    const db = await openDb();
    const count = await wrap(db.transaction('papers').objectStore('papers').count());
    if (count === 0) await addSample();
    localStorage.setItem(SEEDED_KEY, '1');
  } catch (err) {
    console.error('Sample paper', err);
  }
}

window.addSample = addSample; // handy for testing: type addSample() in the Console
seedOnFirstRun();