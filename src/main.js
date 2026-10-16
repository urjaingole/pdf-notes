import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import './style.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const fileInput = document.getElementById('file-input');
const pageEl = document.getElementById('page');

let highlights = [];
let highlightLayer = null;
let popup = null;

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  highlights = [];
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  await renderPage(pdf, 1);
});

async function renderPage(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.4 });
  const dpr = window.devicePixelRatio || 1;

  pageEl.innerHTML = '';
  pageEl.style.width = viewport.width + 'px';
  pageEl.style.height = viewport.height + 'px';
  pageEl.style.setProperty('--scale-factor', viewport.scale);

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width * dpr;
  canvas.height = viewport.height * dpr;
  canvas.style.width = viewport.width + 'px';
  canvas.style.height = viewport.height + 'px';
  pageEl.appendChild(canvas);

  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
    transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
  }).promise;

  const textLayerEl = document.createElement('div');
  textLayerEl.className = 'textLayer';
  pageEl.appendChild(textLayerEl);

  const textLayer = new pdfjsLib.TextLayer({
    textContentSource: page.streamTextContent(),
    container: textLayerEl,
    viewport,
  });
  await textLayer.render();

  // Layer that holds the yellow highlights (sits on top of the text)
  highlightLayer = document.createElement('div');
  highlightLayer.className = 'highlightLayer';
  pageEl.appendChild(highlightLayer);

  // The note pop-up (hidden until needed)
  popup = document.createElement('div');
  popup.className = 'note-popup hidden';
  popup.innerHTML = `
    <textarea placeholder="Why did you highlight this?"></textarea>
    <div class="note-actions">
      <button class="btn-delete">Delete</button>
      <span class="spacer"></span>
      <button class="btn-cancel">Cancel</button>
      <button class="btn-save">Save</button>
    </div>
  `;
  pageEl.appendChild(popup);

  drawHighlights();
}

// When the user finishes selecting text, open the note pop-up
pageEl.addEventListener('mouseup', (e) => {
  if (e.target.closest('.note-popup') || e.target.closest('.highlight')) return;

  setTimeout(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!pageEl.contains(range.commonAncestorContainer)) return;

    const text = sel.toString().trim();
    if (!text) return;

    const origin = pageEl.getBoundingClientRect();
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 1 && r.height > 1)
      .map((r) => ({
        left: r.left - origin.left,
        top: r.top - origin.top,
        width: r.width,
        height: r.height,
      }));
    if (!rects.length) return;

    openPopup({ id: Date.now(), text, rects, note: '' }, true);
  }, 0);
});

function openPopup(h, isNew) {
  const last = h.rects[h.rects.length - 1];
  const popupWidth = 280;
  const left = Math.max(8, Math.min(last.left, pageEl.clientWidth - popupWidth - 8));
  const top = last.top + last.height + 8;

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.classList.remove('hidden');

  const textarea = popup.querySelector('textarea');
  textarea.value = h.note;
  popup.querySelector('.btn-delete').style.display = isNew ? 'none' : 'inline-block';

  const close = () => {
    popup.classList.add('hidden');
    window.getSelection().removeAllRanges();
  };

  popup.querySelector('.btn-save').onclick = () => {
    h.note = textarea.value.trim();
    if (isNew) highlights.push(h);
    drawHighlights();
    close();
  };
  popup.querySelector('.btn-cancel').onclick = close;
  popup.querySelector('.btn-delete').onclick = () => {
    highlights = highlights.filter((x) => x.id !== h.id);
    drawHighlights();
    close();
  };

  setTimeout(() => textarea.focus(), 0);
}

function drawHighlights() {
  highlightLayer.innerHTML = '';
  highlights.forEach((h) => {
    h.rects.forEach((r) => {
      const el = document.createElement('div');
      el.className = 'highlight' + (h.note ? ' has-note' : '');
      el.style.left = r.left + 'px';
      el.style.top = r.top + 'px';
      el.style.width = r.width + 'px';
      el.style.height = r.height + 'px';
      el.title = h.note || 'No note yet';
      el.addEventListener('click', () => openPopup(h, false));
      highlightLayer.appendChild(el);
    });
  });
}