// Keeps the zoom percentage in the small text above OVERVIEW up to date
const toast = document.getElementById('zoom-toast');
const pct = document.getElementById('zoom-pct');
const name = document.getElementById('paper-name');

if (toast && pct) {
  new MutationObserver(() => {
    const t = (toast.textContent || '').trim();
    if (/^\d+%$/.test(t)) {
      pct.textContent = t;
      toast.setAttribute('data-pct', '1');
    } else {
      toast.removeAttribute('data-pct');
    }
  }).observe(toast, { childList: true, characterData: true, subtree: true });

  if (name) {
    // a new paper opens at 100%
    new MutationObserver(() => {
      pct.textContent = '100%';
    }).observe(name, { childList: true, characterData: true, subtree: true });
  }
}