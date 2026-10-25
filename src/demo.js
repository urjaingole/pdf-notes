import './demo.css';

/* Interactive "how it works" demo for the empty home page.
   It watches the library list and mounts itself under the "No papers yet" box.
   Everything is drawn in 1920px design pixels and scaled with --s so it fits the window. */

const DESIGN_W = 1674;
const DESIGN_H = 520; // least design height the demo needs; it grows to fill the window

// Words you may want to change
const TAGLINE = '{No messy margins, just clean highlights}';
const FINAL_LABEL = 'Every note lives on its highlight';
const START_LABEL = '\u201CTRY HIGHLIGHTING TEXT\u201D';

const TEXT =
  'Stories are built from a handful of familiar roles. Seen in a dramaturgical way, each character is a tool the story uses to move forward: the hero who wants something, the mentor who offers a way in, the rival who pushes back. None of these roles is fixed. As the plot develops, the same character can shift from ally to obstacle, and the reader\u2019s understanding of the whole story shifts with them.';
const EXTRA =
  ' Writers return to the same patterns because audiences recognise them quickly, and that recognition lets small changes feel large. Keeping track of who plays which role, and when it changes, is one way to read a story closely. A margin full of scribbles hides all of this, while a page with a few clean highlights and notes shows it at a glance.';
const FINAL_TEXT = TEXT + EXTRA;
const WORD = 'dramaturgical';

// Highlights shown in the finale, next to the visitor's own
const MARKS = [
  { p: 'familiar roles', c: 'green' },
  { p: 'the mentor who offers a way in', c: 'mint' },
  { p: 'None of these roles is fixed', c: 'pink' },
  { p: 'ally to obstacle', c: 'blue' },
  { p: 'recognise them quickly', c: 'mint' },
  { p: 'small changes feel large', c: 'green' },
  { p: 'a few clean highlights and notes', c: 'pink' },
];

const COLORS = [
  { id: 'pink', name: 'Definitions', note: '#FFCBCC', hl: '#F3B8BC', stroke: '#FF8E8E' },
  { id: 'mint', name: 'Questions', note: '#A6F5DD', hl: '#94E3CB', stroke: '#30DFC5' },
  { id: 'blue', name: 'Links', note: '#B2E0FF', hl: '#A1D2F3', stroke: '#26B4FE' },
  { id: 'green', name: 'Ideas', note: '#B9FFB1', hl: '#A8EE9F', stroke: '#6FD960' },
];

const HEART = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF6B6B" stroke="#E04848" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const BIN = `<svg viewBox="0 0 24 26" aria-hidden="true" style="width:calc(14 * var(--p));height:auto;display:block"><rect x="8" y="0" width="8" height="3" rx="1.4" fill="currentColor"/><rect x="0.4" y="2.2" width="23.2" height="3.6" rx="1.6" fill="currentColor"/><path d="M2 5h20v17.2a3.8 3.8 0 0 1-3.8 3.8H5.8A3.8 3.8 0 0 1 2 22.2z" fill="currentColor"/><path d="M8.2 11.4l7.6 7.6m0-7.6l-7.6 7.6" style="stroke:var(--note)" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>`;
const PENCIL = `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:calc(16 * var(--p));height:auto;display:block"><path d="M3 21l1.3-5.2L16.1 4a2.1 2.1 0 0 1 3 0l.9.9a2.1 2.1 0 0 1 0 3L8.2 19.7z" fill="currentColor"/></svg>`;
const CURSOR = `<svg viewBox="0 0 24 24" aria-hidden="true" style="width:100%;height:auto;display:block"><path d="M4 3l16 7.5-6.6 2.2L11 20z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function markup() {
  const squares =
    COLORS.map(
      (c) =>
        `<button type="button" class="dm-sq" data-color="${c.id}" style="--c:${c.note};--sc:${c.stroke}" title="${c.name}" aria-label="${c.name}"></button>`
    ).join('') +
    `<button type="button" class="dm-sq none" data-remove title="Remove highlight" aria-label="Remove highlight"></button>`;

  const legend = COLORS.map(
    (c) =>
      `<span><i style="background:${c.note};box-shadow:inset 0 0 0 1px ${c.stroke}"></i>${c.name}</span>`
  ).join('');

  return `
  <div class="dm" role="group" aria-label="How it works, in four steps">
    <div class="dm-stage">

      <p class="dm-tagline" hidden>${TAGLINE}</p>

      <div class="dm-card dm-c1">
        <div class="dm-strip"><b class="dm-num">1</b><span class="dm-lbl">${START_LABEL}</span></div>
        <div class="dm-paper">
          <div class="dm-tbox"><p class="dm-text"></p></div>
          <div class="dm-hls"></div>
          <div class="dm-legend">${legend}</div>
        </div>
        <i class="dm-veil"></i>
      </div>

      <div class="dm-help" aria-hidden="true">
        <div class="dm-ptr"><span class="dm-line"></span><span class="dm-tri"></span></div>
        <span class="dm-pill">Try demo</span>
      </div>

      <div class="dm-note dm-n2" hidden>
        <div class="dm-tab"><b>2</b><span>\u201CWRITE A NOTE\u201D</span></div>
        <div class="dm-nstrip">${squares}</div>
        <div class="dm-nbody"><textarea class="dm-ta" maxlength="120" placeholder="Type..." aria-label="Your note"></textarea></div>
        <div class="dm-nfoot">
          <div class="dm-actions">
            <button type="button" class="dm-save">Save</button>
            <button type="button" class="dm-cancel">Cancel</button>
          </div>
          <button type="button" class="dm-bin" aria-label="Start over">${BIN}</button>
        </div>
        <i class="dm-veil"></i>
      </div>

      <div class="dm-card dm-c3" hidden>
        <div class="dm-strip"><b>3</b><span>\u201CCLICK ON THE HIGHLIGHT\u201D</span></div>
        <div class="dm-paper">
          <div class="dm-tbox"><p class="dm-text"></p></div>
          <div class="dm-hls"></div>
        </div>
        <i class="dm-veil"></i>
      </div>

      <div class="dm-note dm-n4" hidden>
        <div class="dm-tab"><b>4</b><span>\u201CPICK A COLOR\u201D</span></div>
        <div class="dm-nstrip">${squares}</div>
        <div class="dm-nbody"><div class="dm-ntext"></div></div>
        <div class="dm-nfoot">
          <span class="dm-bin">${BIN}</span>
          <span class="dm-edit">Edit ${PENCIL}</span>
        </div>
        <i class="dm-veil"></i>
      </div>

      <div class="dm-done" hidden>
        <span>Now try it on your own PDF</span>
        <button type="button" class="dm-replay">Replay</button>
      </div>

      <div class="dm-cursor" aria-hidden="true">${CURSOR}</div>
    </div>
  </div>`;
}

function createDemo() {
  const shell = document.createElement('div');
  shell.innerHTML = markup();
  const root = shell.firstElementChild;

  const stage = root.querySelector('.dm-stage');
  const c1 = root.querySelector('.dm-c1');
  const c3 = root.querySelector('.dm-c3');
  const n2 = root.querySelector('.dm-n2');
  const n4 = root.querySelector('.dm-n4');
  const t1 = c1.querySelector('.dm-text');
  const t3 = c3.querySelector('.dm-text');
  const ta = n2.querySelector('.dm-ta');
  const ntext = n4.querySelector('.dm-ntext');
  const done = root.querySelector('.dm-done');
  const cursor = root.querySelector('.dm-cursor');
  const tagline = root.querySelector('.dm-tagline');
  const num = c1.querySelector('.dm-num');
  const lbl = c1.querySelector('.dm-lbl');

  t1.textContent = TEXT;
  t3.textContent = TEXT;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alive = true;
  let s = 1;
  let step = 1; // 1-4 are the steps, 5 is the finale
  let hl = null; // [start, end] character offsets in TEXT
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
    root.querySelectorAll('.dm-sq[data-color]').forEach((b) => {
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
    const base = textEl.closest('.dm-paper').getBoundingClientRect();
    return Array.from(range.getClientRects())
      .filter((r) => r.width > 1)
      .map((r) => ({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }));
  }

  function placeRect(layer, r, c, delay) {
    const pad = 6.5 * s;
    const h = 24 * s;
    const d = document.createElement('div');
    d.className = 'dm-hl';
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
      const i = FINAL_TEXT.indexOf(m.p);
      if (i >= 0) add(i, i + m.p.length, m.c);
    });
    return out;
  }

  function drawHls() {
    const l1 = c1.querySelector('.dm-hls');
    l1.innerHTML = '';
    if (step === 5) {
      finalMarks().forEach((m, i) => {
        rectsFor(t1, m.a, m.b).forEach((r) => placeRect(l1, r, m.c, i * 140));
      });
    } else if (hl) {
      rectsFor(t1, hl[0], hl[1]).forEach((r) => placeRect(l1, r, null, 0));
    }

    // Card 3 is short: scroll its text by whole lines so the highlight is always visible
    const l3 = c3.querySelector('.dm-hls');
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
    while (a < b && /\s/.test(TEXT[a])) a++;
    while (b > a && /\s/.test(TEXT[b - 1])) b--;
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
    el.classList.remove('is-pop');
    void el.offsetWidth;
    el.classList.add('is-pop');
  }

  function go(n) {
    step = n;
    for (let i = 1; i <= 4; i++) root.classList.toggle('step-' + i, i === n);
    root.classList.toggle('is-started', n >= 2); // card 1 moves to the top left once the demo starts
    c1.classList.toggle('is-off', n !== 1);
    n2.classList.toggle('is-off', n !== 2);
    c3.classList.toggle('is-off', n < 3);
    n4.classList.toggle('is-off', n !== 4);

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
      }, 600);
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
      n2.classList.remove('dm-shake');
      void n2.offsetWidth;
      n2.classList.add('dm-shake');
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

    c1.classList.remove('is-off');
    [n2, c3, n4].forEach((el) => el.classList.add('is-off'));
    setTimeout(() => {
      if (!alive || step !== 5) return;
      n2.hidden = true;
      c3.hidden = true;
      n4.hidden = true;
    }, 450);

    num.innerHTML = HEART;
    lbl.textContent = FINAL_LABEL;
    t1.textContent = FINAL_TEXT;
    c1.querySelector('.dm-hls').innerHTML = '';
    tagline.hidden = false;
    done.hidden = false;
    const add = document.querySelector('.add-btn');
    if (add) add.classList.add('dm-pulse');

    // draw the highlights once the card has finished growing
    setTimeout(() => {
      if (alive && step === 5) drawHls();
    }, 850);
  }

  function reset() {
    step = 1;
    hl = null;
    color = 'blue';
    ta.value = '';
    ta.disabled = false;
    ta.placeholder = 'Type...';
    n2.hidden = true;
    c3.hidden = true;
    n4.hidden = true;
    done.hidden = true;
    tagline.hidden = true;
    root.classList.remove('is-done', 'is-final', 'step-5');
    t1.textContent = TEXT;
    num.textContent = '1';
    lbl.textContent = START_LABEL;
    const add = document.querySelector('.add-btn');
    if (add) add.classList.remove('dm-pulse');
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
    stage.querySelectorAll('.dm-sweep, .dm-ripple').forEach((e) => e.remove());
    ta.classList.remove('dm-nudge');
    const ping = c3.querySelector('.dm-ping');
    if (ping) ping.classList.remove('dm-ping');
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
      d.className = 'dm-ripple';
      d.style.left = x + 'px';
      d.style.top = y + 'px';
      stage.appendChild(d);
      setTimeout(() => d.remove(), 800);
    };

    if (step === 1) {
      const i = TEXT.indexOf(WORD);
      const range = document.createRange();
      range.setStart(t1.firstChild, i);
      range.setEnd(t1.firstChild, i + WORD.length);
      const r = rel(range.getBoundingClientRect());
      const sweep = document.createElement('div');
      sweep.className = 'dm-sweep';
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
        [{ x: r.x + r.w * 0.8, y: r.y + r.h + 60 * s }, { x: r.x + r.w * 0.25, y: r.y + r.h / 2 }],
        900
      );
      if (ok()) {
        ta.classList.add('dm-nudge');
        ta.focus({ preventScroll: true });
        await wait(1400);
        ta.classList.remove('dm-nudge');
      }
    } else if (step === 3) {
      const el = c3.querySelector('.dm-hl');
      if (el) {
        const r = rel(el.getBoundingClientRect());
        await glide(
          [{ x: r.x + r.w + 80 * s, y: r.y + r.h + 80 * s }, { x: r.x + r.w / 2, y: r.y + r.h / 2 }],
          900
        );
        if (ok()) {
          ripple(r.x + r.w / 2, r.y + r.h / 2);
          el.classList.add('dm-ping');
          await wait(1300);
          el.classList.remove('dm-ping');
        }
      }
    } else if (step === 4) {
      const b = Array.from(n4.querySelectorAll('.dm-sq[data-color]')).find(
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

  /* ---------- Fit: fill the window to the bottom without scrolling ---------- */

  // Card 1's paper height and number of whole text lines, for each state
  function applyLines(sh) {
    const lineH = 21.6;
    const lines = (ph, extra) => Math.max(3, Math.floor((ph - 40 - extra) / lineH));
    const phInit = Math.max(200, sh - 157 - 36); // starts at 157 and touches the bottom
    const phRun = 356;
    const phFin = Math.max(300, sh - 160); // finale card starts at 124 and touches the bottom
    root.style.setProperty('--ph-init', phInit.toFixed(2));
    root.style.setProperty('--ph-run', String(phRun));
    root.style.setProperty('--ph-fin', phFin.toFixed(2));
    root.style.setProperty('--l-init', String(lines(phInit, 24)));
    root.style.setProperty('--l-run', String(lines(phRun, 24)));
    root.style.setProperty('--l-fin', String(lines(phFin, 76)));
  }

  function fit() {
    if (!alive) return;
    const w = root.clientWidth;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const avail = Math.max(0, window.innerHeight - top - 1);
    s = Math.max(0.42, Math.min(w / DESIGN_W, avail / DESIGN_H, 1));
    const sh = Math.max(DESIGN_H, avail / s); // stage height in design pixels
    root.style.setProperty('--s', s.toFixed(4));
    root.style.setProperty('--sh', sh.toFixed(2));
    root.style.height = Math.round(sh * s) + 'px';
    applyLines(sh);
    drawHls();
  }

  const onResize = () => requestAnimationFrame(fit);

  /* ---------- Events ---------- */

  c3.addEventListener('click', (e) => {
    if (step === 3 && e.target.closest('.dm-hl')) go(4);
  });

  root.addEventListener('click', (e) => {
    const sq = e.target.closest('.dm-sq');
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

  n2.querySelector('.dm-save').addEventListener('click', save);
  n2.querySelector('.dm-cancel').addEventListener('click', () => {
    ta.value = '';
    ta.focus({ preventScroll: true });
  });
  n2.querySelector('.dm-bin').addEventListener('click', reset);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    }
  });
  root.querySelector('.dm-replay').addEventListener('click', reset);

  root.addEventListener('pointerdown', () => {
    stopHint();
    scheduleHint();
  });

  function start() {
    document.addEventListener('mouseup', onMouseUp);
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
    window.removeEventListener('resize', onResize);
    const add = document.querySelector('.add-btn');
    if (add) add.classList.remove('dm-pulse');
    root.remove();
  }

  return { root, start, destroy };
}

/* ---------- Mount under the "No papers yet" box, remove when papers exist ---------- */

const listEl = window.__LANDING__ ? null : document.getElementById('lib-list');
let demo = null;

function sync() {
  if (!listEl) return;
  const empty = listEl.querySelector('.lib-empty');
  if (empty && !listEl.querySelector('.dm')) {
    if (demo) demo.destroy();
    demo = createDemo();
    listEl.appendChild(demo.root);
    demo.start();
  } else if (!empty && demo) {
    demo.destroy();
    demo = null;
  }
}

if (listEl) {
  new MutationObserver(sync).observe(listEl, { childList: true });
  sync();
}