const openBtn = document.getElementById('open');
const libBtn = document.getElementById('library');
const hint = document.getElementById('hint');

let tab = null;

(async () => {
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (e) {
    /* ignore */
  }

  const url = (tab && tab.url) || '';
  if (!/^(https?|file):/i.test(url)) {
    openBtn.disabled = true;
    hint.textContent = 'Open a PDF in this tab first, then click the icon.';
    return;
  }

  const looksPdf = /\.pdf($|[?#])/i.test(url) || /\/pdf\//i.test(url);
  if (url.startsWith('file:')) {
    hint.textContent =
      'Local file. If it does not open, turn on "Allow access to file URLs" in the extension settings.';
  } else {
    hint.textContent = looksPdf
      ? 'PDF found in this tab.'
      : 'This tab may not be a PDF. You can still try.';
  }
})();

openBtn.addEventListener('click', async () => {
  if (!tab || !tab.url) return;
  const target =
    chrome.runtime.getURL('index.html') +
    '?open=' +
    encodeURIComponent(tab.url) +
    '&title=' +
    encodeURIComponent(tab.title || '');
  await chrome.tabs.update(tab.id, { url: target });
  window.close();
});

libBtn.addEventListener('click', async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  window.close();
});