/* No flash of the old design on reload.
   The library stays hidden (see the <style> in index.html) until the page knows what to show. */

const root = document.documentElement;
const list = document.getElementById('lib-list');
let watcher = null;

function markReady() {
  root.classList.add('ready');
  if (watcher) watcher.disconnect();
}

function check() {
  if (root.classList.contains('ready')) return;
  if (!list) {
    markReady();
    return;
  }
  // Papers are saved: library.js switches to the new design first, then we reveal it
  if (list.querySelector(':scope > .paper-card')) {
    requestAnimationFrame(markReady);
    return;
  }
  // Empty library. Extension: the plain empty page is the design.
  // Website: wait until the intro is on screen.
  if (list.querySelector(':scope > .lib-empty')) {
    if (!window.__LANDING__ || document.querySelector('[class^="lp"]')) markReady();
  }
}

watcher = new MutationObserver(check);
watcher.observe(document.body, { childList: true, subtree: true });
check();
setTimeout(markReady, 1500); // safety: it never stays hidden