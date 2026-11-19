import { auth, db, onAuthStateChanged, doc, setDoc, collection, query, where, onSnapshot, serverTimestamp } from '../db/firebase.js';
import { showMessage } from './auth.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const driverCard = (d) => `<article class="driver-card"><div class="driver-top"><span class="avatar">${escapeHtml((d.name || '?').slice(0,2).toUpperCase())}</span><div><strong>${escapeHtml(d.name)}</strong><small>${escapeHtml(d.driverType)} · ${escapeHtml(d.vehicleBrand)} ${escapeHtml(d.vehicleModel)}</small></div></div><div class="driver-meta"><span>${escapeHtml(d.plate)} · ${escapeHtml(d.vehicleColor)} · ${escapeHtml(d.seats)} lugares</span><button class="btn btn-primary" data-approve="${escapeHtml(d.uid)}">Aprovar</button></div></article>`;

function subscribeAdminData() {
  const pending = query(collection(db, 'drivers'), where('status', '==', 'pending'));
  onSnapshot(pending, (snapshot) => {
    const root = document.querySelector('#pending-drivers');
    document.querySelector('#pending-count').textContent = snapshot.size;
    if (root) root.innerHTML = snapshot.empty ? '<p class="muted-copy">Sem cadastros pendentes.</p>' : snapshot.docs.map((item) => driverCard(item.data())).join('');
    root?.querySelectorAll('[data-approve]').forEach((button) => button.addEventListener('click', async () => {
      button.disabled = true;
      await setDoc(doc(db, 'drivers', button.dataset.approve), { status: 'approved', verifiedAt: serverTimestamp(), verifiedBy: auth.currentUser.uid }, { merge: true });
      await setDoc(doc(db, 'users', button.dataset.approve), { driverStatus: 'approved' }, { merge: true });
    }));
  }, (error) => showMessage(`Não foi possível ler os transportes: ${error.message}`, 'error'));
  onSnapshot(collection(db, 'sosAlerts'), (snapshot) => {
    document.querySelector('#alert-count').textContent = snapshot.size;
    const root = document.querySelector('#alerts-list');
    if (root) root.innerHTML = snapshot.empty ? '<p class="muted-copy">Sem alertas registados.</p>' : snapshot.docs.slice(0, 8).map((item) => `<article class="driver-card"><strong>${escapeHtml(item.data().type || 'SOS')}</strong><small>${escapeHtml(item.data().phone || 'Sem telefone')} · ${escapeHtml(item.data().createdAt?.toDate?.().toLocaleString('pt-PT') || 'agora')}</small></article>`).join('');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#admin-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await setDoc(doc(db, 'users', data.uid.trim()), { role: 'admin', active: true, name: data.name, email: data.email.toLowerCase(), createdAt: serverTimestamp() });
      showMessage('Administrador autorizado no Firestore. A conta correspondente já deve existir no Authentication.', 'success');
      event.currentTarget.reset();
    } catch (error) { showMessage(error.message, 'error'); }
  });
  window.addEventListener('rota:admin-ready', subscribeAdminData, { once: true });
});
