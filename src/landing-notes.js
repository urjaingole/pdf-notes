/* Landing finale: click any highlight to read its note.
   The note overlaps the text card, is vertically centered on it, and has a Copy button. */

// The small hint on the left. Set to '' to remove it.
const TIP = 'Click any highlight to read its note';

const FALLBACK = 'Your note goes here.';

const COLOR = {
  pink: { note: '#FFCBCC', stroke: '#FF8E8E' },
  mint: { note: '#A6F5DD', stroke: '#30DFC5' },
  blue: { note: '#B2E0FF', stroke: '#26B4FE' },
  green: { note: '#B9FFB1', stroke: '#6FD960' },
};

// One note per highlighted phrase. Change them freely.
const NOTES = {
  'familiar roles':
    'Idea: stories reuse a small cast. Find the hero, mentor and shadow first, and the plot gets easier to follow.',
  'the mentor who offers a way in': 'Question: what does the mentor want in return? Check the example on page 4.',
  'None of these roles is fixed':
    'Definition: archetype. A recurring pattern of character that audiences recognise across many stories.',
  'ally to obstacle':
    'Link: a friend can turn into an obstacle. More on archetypes: https://en.wikipedia.org/wiki/Archetype',
  'recognise them quickly':
    'Question: is quick recognition the same as being predictable? Bring this to the seminar.',
  'small changes feel large': 'Idea: keep the pattern, change one detail. That is where a story feels new.',
  'a note says why':
    'Definition: a note is the reason you attached to a highlight, so future you remembers why it mattered.',
  'saves you from rereading everything':
    'Link: why writing in the margin helps. https://en.wikipedia.org/wiki/Marginalia',
  'a quick filter': 'Question: what would my own filter be? Ideas, links, definitions or people?',
};

const SVG = 'viewBox="0 0 24 24" aria-hidden="true" style="width:calc(16 * var(--p));height:auto;display:block"';
const COPY_ICON = `<svg ${SVG}><path d="M8 8V3h13v13h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/><rect x="3" y="8" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>`;
const CHECK_ICON = `<svg ${SVG}><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>`;

function setup(root) {
  if (root.dataset.finalnotes) return;
  const stage = root.querySelector('.lp-stage');
  const card = root.querySelector('.lp-c1');
  const textEl = root.querySelector('.lp-c1 .lp-text');
  const layer = root.querySelector('.lp-c1 .lp-hls');
  const ta = root.querySelector('.lp-ta');
  const n4 = root.querySelector('.lp-n4');
  if (!stage || !card || !textEl || !layer || !ta || !n4) return;
  root.dataset.finalnotes = '1';

  // reuse the bin and pencil icons that are already on the page
  const binHTML = n4.querySelector('.lp-bin').innerHTML;
  const editHTML = n4.querySelector('.lp-edit').innerHTML;

  const note = document.createElement('div');
  note.className = 'lp-note lp-n5';
  note.hidden = true;
  note.innerHTML = `
    <div class="lp-nbody"><div class="lp-ntext"></div></div>
    <div class="lp-nfoot">
      <span class="lp-bin">${binHTML}</span>
      <span class="lp-right">
        <button type="button" class="lp-copy">Copy ${COPY_ICON}</button>
        <span class="lp-edit">${editHTML}</span>
      </span>
    </div>`;
  stage.appendChild(note);

  if (TIP) {
    const tip = document.createElement('p');
    tip.className = 'lp-tip';
    tip.textContent = TIP;
    stage.appendChild(tip);
  }

  const ntext = note.querySelector('.lp-ntext');
  const copyBtn = note.querySelector('.lp-copy');
  let current = null; // { phrase, body }
  let pickedA = null;
  let copyTimer = null;

  const isFinal = () => root.classList.contains('is-final');

  // Overlaps the left edge of the card and is centered on its height
  function place() {
    if (note.hidden) return;
    const box = stage.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const w = note.offsetWidth;
    const h = note.offsetHeight;
    note.style.left = c.left - box.left - w + w * 0.217 + 'px'; // 0.217 = how much overlaps the card
    note.style.top = c.top - box.top + c.height / 2 - h / 2 + 'px';
  }

  function markPicked() {
    layer.querySelectorAll('.lp-hl').forEach((el) => {
      el.classList.toggle('is-picked', pickedA !== null && el.dataset.a === String(pickedA));
    });
  }

  // text with clickable links
  function fill(el, str) {
    el.textContent = '';
    str.split(/(https?:\/\/\S+)/).forEach((part) => {
      if (/^https?:\/\//.test(part)) {
        const a = document.createElement('a');
        a.href = part;
        a.textContent = part;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        el.appendChild(a);
      } else if (part) {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  function resetCopyLabel() {
    clearTimeout(copyTimer);
    copyBtn.innerHTML = 'Copy ' + COPY_ICON;
  }

  function openNote(el) {
    const a = Number(el.dataset.a);
    const b = Number(el.dataset.b);
    const phrase = textEl.textContent.slice(a, b);
    const mine = el.dataset.i === '0'; // the visitor's own highlight
    const body = mine ? ta.value.trim() || FALLBACK : NOTES[phrase] || FALLBACK;
    const col = COLOR[el.dataset.cid] || COLOR.blue;

    note.style.setProperty('--note', col.note);
    note.style.setProperty('--stroke', col.stroke);
    fill(ntext, body);
    note.hidden = false;
    current = { phrase, body };
    pickedA = a;
    markPicked();
    place();
    resetCopyLabel();
    root.classList.add('has-note');
  }

  function closeNote() {
    note.hidden = true;
    current = null;
    pickedA = null;
    markPicked();
  }

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!current) return;
    const txt = '\u201C' + current.phrase.replace(/\s+/g, ' ') + '\u201D\nMy note: ' + current.body;
    let ok = false;
    try {
      await navigator.clipboard.writeText(txt);
      ok = true;
    } catch (err) {
      const t = document.createElement('textarea');
      t.value = txt;
      t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t);
      t.select();
      try {
        ok = document.execCommand('copy');
      } catch (e2) {
        /* ignore */
      }
      t.remove();
    }
    copyBtn.innerHTML = (ok ? 'Copied ' : 'Could not copy ') + (ok ? CHECK_ICON : '');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(resetCopyLabel, 1300);
  });

  root.addEventListener('click', (e) => {
    if (!isFinal()) return;
    const el = e.target.closest('.lp-hl');
    if (el && el.dataset.a !== undefined) {
      openNote(el);
      return;
    }
    if (!e.target.closest('.lp-n5')) closeNote();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.isConnected && !note.hidden) closeNote();
  });

  // Replay: clear everything
  new MutationObserver(() => {
    if (!isFinal()) {
      closeNote();
      root.classList.remove('has-note');
    }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  // The highlights are redrawn when the window changes size: keep the picked one marked
  new MutationObserver(markPicked).observe(layer, { childList: true });

  // The page rescaled: keep the note centered on the card
  new MutationObserver(place).observe(root, { attributes: true, attributeFilter: ['style'] });
  window.addEventListener('resize', () => requestAnimationFrame(place));
}

const find = () => document.querySelectorAll('.lp').forEach(setup);
new MutationObserver(find).observe(document.body, { childList: true });
find();