// Opens the PDF passed in the address (?open=...). The extension popup uses this.
const params = new URLSearchParams(location.search);
const src = params.get('open');

if (src) {
  // so a reload doesn't add the paper again
  history.replaceState(null, '', location.pathname);

  (async () => {
    try {
      const res = await fetch(src, { credentials: 'include' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = await res.arrayBuffer();

      const head = new TextDecoder().decode(new Uint8Array(buf, 0, 5));
      if (!head.startsWith('%PDF')) throw new Error('This tab is not a PDF');

      let name = (params.get('title') || '').trim();
      if (!name) {
        try {
          name = decodeURIComponent(new URL(src).pathname.split('/').pop() || '');
        } catch (e) {
          /* ignore */
        }
      }
      name = (name || 'Paper').replace(/[\\/:*?"<>|]+/g, ' ').trim();
      if (!/\.pdf$/i.test(name)) name += '.pdf';

      // hands the file to the normal "Add PDF" button
      const file = new File([buf], name, { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.getElementById('file-input');
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (err) {
      console.error(err);
      const msg = document.getElementById('lib-msg');
      if (msg) {
        msg.textContent = "That PDF couldn't be opened (" + err.message + ').';
        msg.classList.remove('hidden');
      }
    }
  })();
}