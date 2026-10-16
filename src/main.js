import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import './style.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const fileInput = document.getElementById('file-input');
const pageEl = document.getElementById('page');

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
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

  // Canvas draws the visible page
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

  // Invisible text layer on top, so text can be selected
  const textLayerEl = document.createElement('div');
  textLayerEl.className = 'textLayer';
  pageEl.appendChild(textLayerEl);

  const textLayer = new pdfjsLib.TextLayer({
    textContentSource: page.streamTextContent(),
    container: textLayerEl,
    viewport,
  });
  await textLayer.render();
}