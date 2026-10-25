import './landing.css';

/* Landing page for the empty library: a 1920x1080 design scaled to the window.
   It shows on top of the app whenever the library has no papers. */

const DESIGN_W = 1920;
const DESIGN_H = 1080;

// Words on the page: change them here
const COPY = {
  top: 'A browser extension for people who highlight on PDFs and prefer a simple reader',
  title: 'Never forget why you highlighted it.<br>Stick notes right on the highlight.',
  sub: 'Every note opens like a real sticky note',
  left: 'Remember why.<br>See only what matters.<br>Never run out of room.',
  cap: '{Try it before you install}',
  capDone: '{Like it? Install it}',
  cta: '[Install]',
  soon: 'The extension is on its way.',
  open: 'Open a PDF in the web version',
};

const TEXT =
  'Stories are built from a handful of familiar roles. Seen in a dramaturgical way, each character is a tool the story uses to move forward: the hero who wants something, the mentor who offers a way in, the rival who pushes back. None of these roles is fixed. As the plot develops, the same character can shift from ally to obstacle, and the reader\u2019s understanding of the whole story shifts with them.';
const EXTRA =
  ' Writers return to the same patterns because audiences recognise them quickly, and that recognition lets small changes feel large. Keeping track of who plays which role, and when it changes, is one way to read a story closely.';
const MORE =
  ' Reading closely is slower than skimming, but it pays off. A highlight on its own only says that something mattered; a note says why. When you come back weeks later, the why is what saves you from rereading everything. Colors help too: pick one for definitions and another for questions, and a quick filter shows only the kind you need today.';
const LONG_TEXT = TEXT + EXTRA + MORE;
const WORD = 'dramaturgical';

// Highlights that fill the card at the end, next to the visitor's own
const MARKS = [
  { p: 'familiar roles', c: 'green' },
  { p: 'the mentor who offers a way in', c: 'mint' },
  { p: 'None of these roles is fixed', c: 'pink' },
  { p: 'ally to obstacle', c: 'blue' },
  { p: 'recognise them quickly', c: 'mint' },
  { p: 'small changes feel large', c: 'green' },
  { p: 'a note says why', c: 'pink' },
  { p: 'saves you from rereading everything', c: 'blue' },
  { p: 'a quick filter', c: 'mint' },
];

const COLORS = [
  { id: 'pink', name: 'Definitions', note: '#FFCBCC', hl: '#F3B8BC', stroke: '#FF8E8E' },
  { id: 'mint', name: 'Questions', note: '#A6F5DD', hl: '#94E3CB', stroke: '#30DFC5' },
  { id: 'blue', name: 'Links', note: '#B2E0FF', hl: '#A1D2F3', stroke: '#26B4FE' },
  { id: 'green', name: 'Ideas', note: '#B9FFB1', hl: '#A8EE9F', stroke: '#6FD960' },
];

const BIN = `<svg viewBox="0 0 24 26" aria-hidden="true" style="width:calc(14 * var(--p));height:auto;display:block"><rect x="8" y="0" width="8" height="3" rx="1.4" fill="currentColor"/><rect x="0.4" y="2.2" width="23.2" height="3.6" rx="1.6" fill="currentColor"/><path d="M2 5h20v17.2a3.8 3.8 0 0 1-3.8 3.8H5.8A3.8 3.8 0 0 1 2 22.2z" fill="currentColor"/><path d="M8.2 11.4l7.6 7.6m0-7.6l-7.6 7.6" style="stroke:var(--note)" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>`;
const PENCIL = `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:calc(16 * var(--p));height:auto;display:block"><path d="M3 21l1.3-5.2L16.1 4a2.1 2.1 0 0 1 3 0l.9.9a2.1 2.1 0 0 1 0 3L8.2 19.7z" fill="currentColor"/></svg>`;
const CURSOR = `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:100%;height:auto;display:block"><path d="M4 3l16 7.5-6.6 2.2L11 20z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function markup() {
  const squares =
    COLORS.map(
      (c) =>
        `<button type="button" class="lp-sq" data-color="${c.id}" style="--c:${c.note};--sc:${c.stroke}" title="${c.name}" aria-label="${c.name}"></button>`
    ).join('') +
    `<button type="button" class="lp-sq none" data-remove title="Remove highlight" aria-label="Remove highlight"></button>`;

  const legend = COLORS.map(
    (c) =>
      `<span><i style="background:${c.note};box-shadow:inset 0 0 0 1px ${c.stroke}"></i>${c.name}</span>`
  ).join('');

  return `
  <div class="lp" role="region" aria-label="Notes Embedder">
    <div class="lp-stage">
      <p class="lp-top">${COPY.top}</p>
      <h2 class="lp-title">${COPY.title}</h2>
      <i class="lp-dot"></i>
      <p class="lp-sub">${COPY.sub}</p>

      <p class="lp-left">${COPY.left}</p>
      <p class="lp-cap">${COPY.cap}</p>
      <button type="button" class="lp-step">Step 01</button>
      <div class="lp-ptr" aria-hidden="true"><span class="lp-line"></span><span class="lp-tri"></span></div>
      <button type="button" class="lp-cta">${COPY.cta}</button>
      <div class="lp-pop" hidden>
        <p>${COPY.soon}</p>
        <button type="button" class="lp-open">${COPY.open}</button>
      </div>

      <div class="lp-card lp-c1 is-active">
        <div class="lp-strip"><b>1</b><span>\u201CTRY HIGHLIGHTING TEXT\u201D</span></div>
        <div class="lp-paper">
          <div class="lp-tbox"><p class="lp-text"></p></div>
          <div class="lp-hls"></div>
          <div class="lp-legend">${legend}</div>
        </div>
      </div>

      <div class="lp-note lp-n2" hidden>
        <div class="lp-tab"><b>2</b><span>\u201CWRITE A NOTE\u201D</span></div>
        <div class="lp-nstrip">${squares}</div>
        <div class="lp-nbody"><textarea class="lp-ta" maxlength="160" placeholder="Type..." aria-label="Your note"></textarea></div>
        <div class="lp-nfoot">
          <div class="lp-actions">
            <button type="button" class="lp-save">Save</button>
            <button type="button" class="lp-cancel">Cancel</button>
          </div>
          <button type="button" class="lp-bin" aria-label="Start over">${BIN}</button>
        </div>
        <i class="lp-veil"></i>
      </div>

      <div class="lp-card lp-c3" hidden>
        <div class="lp-strip"><b>3</b><span>\u201CCLICK ON THE HIGHLIGHT\u201D</span></div>
        <div class="lp-paper">
          <div class="lp-tbox"><p class="lp-text"></p></div>
          <div class="lp-hls"></div>
        </div>
        <i class="lp-veil"></i>
      </div>

      <div class="lp-note lp-n4" hidden>
        <div class="lp-tab"><b>4</b><span>\u201CPICK A COLOR\u201D</span></div>
        <div class="lp-nstrip">${squares}</div>
        <div class="lp-nbody"><div class="lp-ntext"></div></div>
        <div class="lp-nfoot">
          <span class="lp-bin">${BIN}</span>
          <span class="lp-edit">Edit ${PENCIL}</span>
        </div>
        <i class="lp-veil"></i>
      </div>

      <div class="lp-cursor" aria-hidden="true">${CURSOR}</div>
    </div>
  </div>`;
}

function createLanding() {
  const shell = document.createElement('div');
  shell.innerHTML = markup();
  const root = shell.firstElementChild;
  const q = (sel) => root.querySelector(sel);

  const stage = q('.lp-stage');
  const c1 = q('.lp-c1');
  const c3 = q('.lp-c3');
  const n2 = q('.lp-n2');
  const n4 = q('.lp-n4');
  const t1 = c1.querySelector('.lp-text');
  const t3 = c3.querySelector('.lp-text');
  const ta = n2.querySelector('.lp-ta');
  const ntext = n4.querySelector('.lp-ntext');
  const pill = q('.lp-step');
  const cap = q('.lp-cap');
  const cta = q('.lp-cta');
  const pop = q('.lp-pop');
  const cursor = q('.lp-cursor');

  t1.textContent = LONG_TEXT;
  t3.textContent = LONG_TEXT;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alive = true;
  let s = 1;
  let step = 1; // 1-4 are the steps, 5 is the finale
  let hl = null; // [start, end] character offsets in LONG_TEXT
  let color = 'blue';
  let hintTimer = null;
  let hintToken = 0;

  const colorOf = (id) => COLORS.find((c) => c.id === id) || COLORS[2];

  function applyColor() {
    const c = colorOf(color);
    root.style.setProperty('--note', c.note);
    root.style.setProperty('--stroke', c.stroke);
    root.style.setProperty('--hl', c.hl);
    root.style.setProperty('--hl-stroke', c.stroke);
    root.querySelectorAll('.lp-sq[data-color]').forEach((b) => {
      b.classList.toggle('is-current', b.dataset.color === color);
    });
  }

  /* ---------- Highlight rectangles ---------- */

  function rectsFor(textEl, a, b) {
    const node = textEl.firstChild;
    if (!node) return [];
    const range = document.createRange();
    range.setStart(node, a);
    range.setEnd(node, b);
    const base = textEl.closest('.lp-paper').getBoundingClientRect();
    return Array.from(range.getClientRects())
      .filter((r) => r.width > 1)
      .map((r) => ({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }));
  }

  function placeRect(layer, r, c, delay) {
    const pad = 6.5 * s;
    const h = 24 * s;
    const d = document.createElement('div');
    d.className = 'lp-hl';
    d.style.cssText = `left:${r.x - pad}px;top:${r.y + r.h / 2 - h / 2}px;width:${r.w + 2 * pad}px;height:${h}px`;
    if (c) {
      d.style.setProperty('--hl', c.hl);
      d.style.setProperty('--hl-stroke', c.stroke);
    }
    if (delay) d.style.animationDelay = delay + 'ms';
    layer.appendChild(d);
  }

  // The visitor's highlight plus the finale highlights (no overlaps)
  function finalMarks() {
    const out = [];
    const taken = [];
    const add = (a, b, cid) => {
      if (taken.some(([x, y]) => a < y && b > x)) return;
      taken.push([a, b]);
      out.push({ a, b, c: colorOf(cid) });
    };
    if (hl) add(hl[0], hl[1], color);
    MARKS.forEach((m) => {
      const i = LONG_TEXT.indexOf(m.p);
      if (i >= 0) add(i, i + m.p.length, m.c);
    });
    return out;
  }

  function drawHls() {
    const l1 = c1.querySelector('.lp-hls');
    l1.innerHTML = '';
    if (step === 5) {
      finalMarks().forEach((m, i) => {
        rectsFor(t1, m.a, m.b).forEach((r) => placeRect(l1, r, m.c, i * 140));
      });
    } else if (hl) {
      rectsFor(t1, hl[0], hl[1]).forEach((r) => placeRect(l1, r, null, 0));
    }

    // Card 3 is short: scroll its text by whole lines so the highlight is always visible
    const l3 = c3.querySelector('.lp-hls');
    l3.innerHTML = '';
    t3.style.marginTop = '0px';
    if (!hl || c3.hidden || step === 5) return;
    let rects = rectsFor(t3, hl[0], hl[1]);
    if (rects.length) {
      const lineH = parseFloat(getComputedStyle(t3).lineHeight) || 21.6 * s;
      const top = Math.min(...rects.map((r) => r.y));
      const idx = Math.round((top - 40 * s) / lineH);
      if (idx > 2) {
        t3.style.marginTop = -((idx - 2) * lineH) + 'px';
        rects = rectsFor(t3, hl[0], hl[1]);
      }
    }
    rects.forEach((r) => placeRect(l3, r, null, 0));
  }

  function selectionOffsets() {
    const sel = window.getSelection();
    const node = t1.firstChild;
    if (!sel || sel.isCollapsed || !sel.rangeCount || !node) return null;
    const r = sel.getRangeAt(0);
    if (!r.intersectsNode(node)) return null;
    const pos = (container, offset, fallback) =>
      container === node ? offset : t1.contains(container) ? (offset > 0 ? node.length : 0) : fallback;
    let a = pos(r.startContainer, r.startOffset, 0);
    let b = pos(r.endContainer, r.endOffset, node.length);
    if (a > b) [a, b] = [b, a];
    while (a < b && /\s/.test(LONG_TEXT[a])) a++;
    while (b > a && /\s/.test(LONG_TEXT[b - 1])) b--;
    if (b - a > 140) b = a + 140;
    return b - a >= 2 ? [a, b] : null;
  }

  function onMouseUp() {
    if (step !== 1 || !alive) return;
    setTimeout(() => {
      if (step !== 1 || !alive) return;
      const off = selectionOffsets();
      if (!off) return;
      hl = off;
      window.getSelection().removeAllRanges();
      drawHls();
      setTimeout(() => {
        if (alive && step === 1) go(2);
      }, 500);
    }, 0);
  }

  /* ---------- Steps ---------- */

  function show(el) {
    el.hidden = false;
    el.classList.remove('is-pop', 'is-fading');
    void el.offsetWidth;
    el.classList.add('is-pop');
  }

  function go(n) {
    step = n;
    for (let i = 1; i <= 4; i++) root.classList.toggle('step-' + i, i === n);
    c1.classList.toggle('is-active', n === 1);
    c3.classList.toggle('is-active', n === 3);
    pill.textContent = 'Step 0' + n;
    cap.textContent = COPY.cap;

    if (n === 1) {
      n2.hidden = true;
      c3.hidden = true;
      n4.hidden = true;
    }
    if (n === 2) {
      c3.hidden = true;
      n4.hidden = true;
      show(n2);
      ta.disabled = false;
      setTimeout(() => {
        if (alive && step === 2) ta.focus({ preventScroll: true });
      }, 500);
    }
    if (n === 3) {
      ta.disabled = true;
      n4.hidden = true;
      show(c3);
      drawHls();
    }
    if (n === 4) {
      ntext.textContent = ta.value.trim();
      show(n4);
    }
    stopHint();
    scheduleHint();
  }

  function save() {
    if (!ta.value.trim()) {
      ta.placeholder = 'Type anything...';
      n2.classList.remove('lp-shake');
      void n2.offsetWidth;
      n2.classList.add('lp-shake');
      ta.focus({ preventScroll: true });
      return;
    }
    go(3);
  }

  // Step 4 done: let the new color settle, then show the finale
  function finish() {
    root.classList.add('is-done');
    stopHint();
    setTimeout(() => {
      if (alive && step === 4 && root.classList.contains('is-done')) goFinal();
    }, 1200);
  }

  function goFinal() {
    step = 5;
    for (let i = 1; i <= 4; i++) root.classList.remove('step-' + i);
    root.classList.add('step-5', 'is-final');
    stopHint();
    c1.classList.remove('is-active');
    c3.classList.remove('is-active');

    const gone = [n2, c3, n4];
    gone.forEach((el) => el.classList.add('is-fading'));
    setTimeout(() => {
      if (!alive || step !== 5) return;
      gone.forEach((el) => {
        el.hidden = true;
        el.classList.remove('is-fading');
      });
      drawHls();
    }, 450);

    pill.textContent = 'Replay';
    cap.textContent = COPY.capDone;
    cta.classList.add('lp-pulse');
  }

  function reset() {
    step = 1;
    hl = null;
    color = 'blue';
    ta.value = '';
    ta.disabled = false;
    ta.placeholder = 'Type...';
    [n2, c3, n4].forEach((el) => {
      el.hidden = true;
      el.classList.remove('is-fading');
    });
    root.classList.remove('is-done', 'is-final', 'step-5');
    cta.classList.remove('lp-pulse');
    applyColor();
    drawHls();
    go(1);
  }

  /* ---------- Idle hints: a ghost cursor shows what to do ---------- */

  function stopHint() {
    hintToken++;
    clearTimeout(hintTimer);
    cursor.getAnimations().forEach((a) => a.cancel());
    cursor.style.opacity = '0';
    stage.querySelectorAll('.lp-sweep, .lp-ripple').forEach((e) => e.remove());
    ta.classList.remove('lp-nudge');
    const ping = c3.querySelector('.lp-ping');
    if (ping) ping.classList.remove('lp-ping');
  }

  function scheduleHint() {
    clearTimeout(hintTimer);
    if (reduce || !alive || root.classList.contains('is-done') || step > 4) return;
    hintTimer = setTimeout(runHint, step === 1 ? 2500 : 4000);
  }

  async function runHint() {
    if (!alive || root.classList.contains('is-done') || step > 4) return;
    const t = ++hintToken;
    const ok = () => alive && t === hintToken;
    const box = stage.getBoundingClientRect();
    const rel = (r) => ({ x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height });

    const glide = async (pts, ms) => {
      if (!ok()) return;
      cursor.getAnimations().forEach((a) => a.cancel());
      cursor.style.opacity = '1';
      const an = cursor.animate(
        pts.map((p) => ({ transform: `translate(${p.x}px, ${p.y}px)` })),
        { duration: ms, easing: 'ease-in-out', fill: 'forwards' }
      );
      try {
        await an.finished;
      } catch (e) {
        /* cancelled */
      }
    };

    const ripple = (x, y) => {
      const d = document.createElement('div');
      d.className = 'lp-ripple';
      d.style.left = x + 'px';
      d.style.top = y + 'px';
      stage.appendChild(d);
      setTimeout(() => d.remove(), 800);
    };

    if (step === 1) {
      const i = LONG_TEXT.indexOf(WORD);
      const range = document.createRange();
      range.setStart(t1.firstChild, i);
      range.setEnd(t1.firstChild, i + WORD.length);
      const r = rel(range.getBoundingClientRect());
      const sweep = document.createElement('div');
      sweep.className = 'lp-sweep';
      sweep.style.cssText = `left:${r.x}px;top:${r.y}px;width:0;height:${r.h}px`;
      stage.appendChild(sweep);
      await glide([{ x: r.x - 70 * s, y: r.y + 70 * s }, { x: r.x, y: r.y + r.h / 2 }], 800);
      if (ok()) {
        sweep.animate([{ width: '0px' }, { width: r.w + 'px' }], {
          duration: 750,
          easing: 'ease-in-out',
          fill: 'forwards',
        });
        await glide([{ x: r.x, y: r.y + r.h / 2 }, { x: r.x + r.w, y: r.y + r.h / 2 }], 750);
        await wait(700);
      }
      sweep.remove();
    } else if (step === 2) {
      const r = rel(ta.getBoundingClientRect());
      await glide(
        [{ x: r.x + r.w * 0.8, y: r.y + r.h + 60 * s }, { x: r.x + r.w * 0.25, y: r.y + 24 * s }],
        900
      );
      if (ok()) {
        ta.classList.add('lp-nudge');
        ta.focus({ preventScroll: true });
        await wait(1400);
        ta.classList.remove('lp-nudge');
      }
    } else if (step === 3) {
      const el = c3.querySelector('.lp-hl');
      if (el) {
        const r = rel(el.getBoundingClientRect());
        await glide(
          [{ x: r.x + r.w + 80 * s, y: r.y + r.h + 80 * s }, { x: r.x + r.w / 2, y: r.y + r.h / 2 }],
          900
        );
        if (ok()) {
          ripple(r.x + r.w / 2, r.y + r.h / 2);
          el.classList.add('lp-ping');
          await wait(1300);
          el.classList.remove('lp-ping');
        }
      }
    } else if (step === 4) {
      const b = Array.from(n4.querySelectorAll('.lp-sq[data-color]')).find(
        (x) => !x.classList.contains('is-current')
      );
      if (b) {
        const r = rel(b.getBoundingClientRect());
        await glide([{ x: r.x + 90 * s, y: r.y + 90 * s }, { x: r.x + r.w / 2, y: r.y + r.h / 2 }], 900);
        if (ok()) {
          ripple(r.x + r.w / 2, r.y + r.h / 2);
          await wait(900);
        }
      }
    }

    if (ok()) {
      cursor.style.opacity = '0';
      hintTimer = setTimeout(runHint, 6500);
    }
  }

  /* ---------- Fit the design to the window ---------- */

  function fit() {
    if (!alive) return;
    s = Math.max(0.4, Math.min(1, root.clientWidth / DESIGN_W, (root.clientHeight - 232 * Math.min(1, Math.max(0.6, root.clientWidth / DESIGN_W))) / (DESIGN_H - 232)));
    root.style.setProperty('--s', s.toFixed(4));
    drawHls();
  }

  const onResize = () => requestAnimationFrame(fit);

  /* ---------- Events ---------- */

  c3.addEventListener('click', (e) => {
    if (step === 3 && e.target.closest('.lp-hl')) go(4);
  });

  root.addEventListener('click', (e) => {
    const sq = e.target.closest('.lp-sq');
    if (!sq) return;
    if (sq.hasAttribute('data-remove')) {
      reset();
      return;
    }
    const id = sq.dataset.color;
    if (id === color) return;
    color = id;
    applyColor();
    if (step === 4 && !root.classList.contains('is-done')) finish();
  });

  n2.querySelector('.lp-save').addEventListener('click', save);
  n2.querySelector('.lp-cancel').addEventListener('click', () => {
    ta.value = '';
    ta.focus({ preventScroll: true });
  });
  n2.querySelector('.lp-bin').addEventListener('click', reset);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    }
  });

  pill.addEventListener('click', () => {
    if (step === 5) reset();
  });

  cta.addEventListener('click', () => {
    pop.hidden = !pop.hidden;
  });
  q('.lp-open').addEventListener('click', () => {
    pop.hidden = true;
    const input = document.getElementById('file-input');
    if (input) input.click();
  });
  const onDocDown = (e) => {
    if (!pop.hidden && !e.target.closest('.lp-pop') && !e.target.closest('.lp-cta')) pop.hidden = true;
  };

  root.addEventListener('pointerdown', () => {
    stopHint();
    scheduleHint();
  });

  function start() {
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousedown', onDocDown);
    window.addEventListener('resize', onResize);
    applyColor();
    fit();
    go(1);
    requestAnimationFrame(fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    setTimeout(fit, 400);
  }

  function destroy() {
    alive = false;
    stopHint();
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('mousedown', onDocDown);
    window.removeEventListener('resize', onResize);
    root.remove();
  }

  return { root, start, destroy };
}

/* ---------- Show the landing page when the library is empty, hide it otherwise ---------- */

const libraryEl = document.getElementById('library');
const listEl = document.getElementById('lib-list');
let landing = null;

function wanted() {
  return (
    !!libraryEl &&
    !!listEl &&
    !libraryEl.classList.contains('hidden') &&
    !!listEl.querySelector('.lib-empty')
  );
}

function sync() {
  const want = wanted();
  if (want && !landing) {
    landing = createLanding();
    document.body.appendChild(landing.root);
    landing.start();
  } else if (!want && landing) {
    landing.destroy();
    landing = null;
  }
}

if (libraryEl && listEl) {
  new MutationObserver(sync).observe(listEl, { childList: true });
  new MutationObserver(sync).observe(libraryEl, { attributes: true, attributeFilter: ['class'] });
  sync();
}