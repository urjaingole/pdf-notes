// Tells the app whether it runs as a website or as the browser extension.
// Extension pages have an address that starts with chrome-extension:// (Edge uses the same).
// The landing page (with the Install button) only belongs to the website.
const isExtension = ['chrome-extension:', 'moz-extension:', 'safari-web-extension:'].includes(
  location.protocol
);
window.__EXTENSION__ = isExtension;
window.__LANDING__ = !isExtension;

if (!isExtension) {
  import('./landing.js');
  import('./landing-typing.js');
  import('./landing-notes.js');
}