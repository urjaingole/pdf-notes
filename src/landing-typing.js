/* Landing demo, step 2: the note types itself when you hover over it, then points at Save.
   Loaded next to landing.js (see flags.js). */

// The note that types itself. Keep it short: the demo note box is small.
const NOTE = 'Dramaturgy: the art and theory of how stories and scripts are built for the stage or screen.';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setup(root) {
  if (root.dataset.autotype) return;
  const ta = root.querySelector('.lp-ta');
  const save = root.querySelector('.lp-save');
  const stage = root.querySelector('.lp-stage');
  const cursor = root.querySelector('.lp-cursor');
  if (!ta || !save || !stage) return;
  root.dataset.autotype = '1';

  let done = false; // typed once in this run of the demo
  let typing = false;
  let token = 0; // changing it stops a typing run in progress
  let dwell = null;

  const inStep2 = () => root.classList.contains('step-2');

  function clearCue() {
    save.classList.remove('lp-cue');
    root.querySelectorAll('.lp-cue-ripple').forEach((e) => e.remove());
  }

  // Save pulses, and the ghost cursor glides to it
  async function cue(t) {
    save.classList.add('lp-cue');
    if (reduce || !cursor) return;

    const box = stage.getBoundingClientRect();
    const a = ta.getBoundingClientRect();
    const b = save.getBoundingClientRect();
    const from = { x: a.left - box.left + a.width * 0.7, y: a.top - box.top + a.height * 0.6 };
    const to = { x: b.left - box.left + b.width / 2, y: b.top - box.top + b.height / 2 };

    cursor.getAnimations().forEach((x) => x.cancel());
    cursor.style.opacity = '1';
    const move = cursor.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px)` },
        { transform: `translate(${to.x}px, ${to.y}px)` },
      ],
      { duration: 900, easing: 'ease-in-out', fill: 'forwards' }
    );
    try {
      await move.finished;
    } catch (e) {
      return; // cancelled
    }
    if (t !== token || !inStep2()) return;

    const rp = document.createElement('div');
    rp.className = 'lp-ripple lp-cue-ripple';
    rp.style.left = to.x + 'px';
    rp.style.top = to.y + 'px';
    stage.appendChild(rp);
    setTimeout(() => rp.remove(), 800);

    await sleep(2200);
    if (t === token) cursor.style.opacity = '0';
  }

  async function typeNote() {
    if (done || typing || !inStep2() || ta.disabled || ta.value.trim()) return;
    typing = true;
    done = true;
    const t = ++token;
    ta.focus({ preventScroll: true });

    if (reduce) {
      ta.value = NOTE;
      typing = false;
      cue(t);
      return;
    }

    ta.value = '';
    for (let i = 1; i <= NOTE.length; i++) {
      if (t !== token || !inStep2()) {
        typing = false;
        return;
      }
      ta.value = NOTE.slice(0, i);
      ta.scrollTop = ta.scrollHeight;
      const ch = NOTE[i - 1];
      await sleep(/[.,:;]/.test(ch) ? 70 : ch === ' ' ? 12 : 12 + Math.random() * 14);
    }
    typing = false;
    if (t !== token || !inStep2()) return;
    await sleep(350);
    if (t === token && inStep2()) cue(t);
  }

  // Start: hover for a moment, click/tap, or when the idle hint nudges the box
  ta.addEventListener('pointerenter', () => {
    clearTimeout(dwell);
    dwell = setTimeout(typeNote, 250);
  });
  ta.addEventListener('pointerleave', () => clearTimeout(dwell));
  ta.addEventListener('pointerdown', () => {
    clearTimeout(dwell);
    typeNote();
  });
  new MutationObserver(() => {
    if (ta.classList.contains('lp-nudge')) typeNote();
  }).observe(ta, { attributes: true, attributeFilter: ['class'] });

  // The visitor starts typing themselves: stop, and leave their text
  ta.addEventListener('keydown', () => {
    if (typing) {
      token++;
      typing = false;
    }
    clearCue();
  });

  save.addEventListener('click', clearCue);

  // Leaving step 2 stops everything. Back at step 1 (demo restarted), it can type again.
  new MutationObserver(() => {
    if (!inStep2()) {
      token++;
      typing = false;
      clearCue();
      if (root.classList.contains('step-1')) done = false;
    }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
}

const find = () => document.querySelectorAll('.lp').forEach(setup);
new MutationObserver(find).observe(document.body, { childList: true });
find();