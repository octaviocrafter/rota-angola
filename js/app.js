const $ = (selector) => document.querySelector(selector);

function closeModal() {
  const modal = $('#modal');
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
}

function openModal(title, body) {
  const modal = $('#modal');
  const content = $('#modal-content');
  if (!modal || !content || !title || !body) return;
  content.innerHTML = `<h3>${title}</h3>${body}`;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
}

function setupTheme() {
  const saved = localStorage.getItem('rota-theme') || 'light';
  document.documentElement.dataset.theme = saved;
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.textContent = saved === 'dark' ? '☾' : '☼';
    button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('rota-theme', next);
      button.textContent = next === 'dark' ? '☾' : '☼';
    });
  });
}

function setup() {
  // Limpa qualquer estado residual de uma versão anterior em cache.
  closeModal();
  setupTheme();

  document.querySelectorAll('[data-dest]').forEach((button) => {
    button.addEventListener('click', () => {
      $('#destination').value = button.dataset.dest;
      window.filterDrivers?.(button.dataset.dest);
    });
  });
  $('#search-btn')?.addEventListener('click', () => window.filterDrivers?.($('#destination').value));
  $('#destination')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') window.filterDrivers?.(event.target.value);
  });
  $('[data-how-install]')?.addEventListener('click', () => openModal('Como instalar a ROTA', '<p><b>Android Chrome:</b> abra o menu ⋮, escolha “Adicionar à tela inicial” e depois “Instalar”.</p><p><b>iPhone Safari:</b> toque em Partilhar, escolha “Adicionar ao ecrã principal” e confirme.</p>'));
  $('[data-open-help]')?.addEventListener('click', () => openModal('Antes de entrar', '<ul><li>Compare a matrícula no aplicativo com a matrícula do veículo.</li><li>Confirme a foto e o nome do condutor.</li><li>Se algo estiver errado, não entre e use Denunciar.</li></ul>'));
  $('[data-share]')?.addEventListener('click', () => {
    const url = `${location.href}?viagem=rota-demo`;
    if (navigator.share) {
      navigator.share({ title: 'Minha viagem ROTA', text: 'Acompanhe a minha viagem com a ROTA.', url });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => openModal('Viagem pronta para partilhar', '<p>O link seguro foi copiado. Envie-o ao seu familiar por WhatsApp ou SMS.</p>'));
    }
  });
  $('[data-close-modal]')?.addEventListener('click', closeModal);
  $('#modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'modal') closeModal();
  });
}

document.addEventListener('DOMContentLoaded', setup);
window.addEventListener('pageshow', closeModal);
