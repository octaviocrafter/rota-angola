// Instalação PWA: o Service Worker vive na raiz para cobrir a homepage e todas as páginas internas.
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstall = event; document.querySelectorAll('[data-install]').forEach((button) => { button.hidden = false; }); });
async function installRota() { if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; } else { document.dispatchEvent(new CustomEvent('rota:how-install')); } }
document.addEventListener('click', (event) => { if (event.target.closest('[data-install]')) installRota(); });
window.addEventListener('load', () => { if (!('serviceWorker' in navigator)) return; const workerPath = `${new URL('../sw.js', document.baseURI).pathname}`; navigator.serviceWorker.register(workerPath, { scope: '/' }).catch((error) => console.warn('[ROTA] Service Worker não registado:', error)); });
