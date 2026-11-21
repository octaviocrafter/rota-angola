import { auth, db, onAuthStateChanged, doc, setDoc, deleteDoc, collection, query, where, onSnapshot, serverTimestamp } from '../db/firebase.js';
import { showMessage } from './auth.js';

// PAINEL ADMIN: todas as acções abaixo escrevem no Firestore e respeitam as regras de Principal/Admin.
const PRINCIPAL_EMAIL = 'octaviomagrelo940@gmail.com';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const driverCard = (d, action) => `<article class="driver-card"><div class="driver-top"><span class="avatar">${escapeHtml((d.name || '?').slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(d.name)}</strong><small>${escapeHtml(d.driverType)} · ${escapeHtml(d.vehicleBrand)} ${escapeHtml(d.vehicleModel)}</small></div></div><div class="driver-meta"><span>${escapeHtml(d.plate)} · ${escapeHtml(d.vehicleColor)} · ${escapeHtml(d.seats)} lugares</span>${action}</div></article>`;

function bindButtons(root) {
  root?.querySelectorAll('[data-driver-action]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const status = button.dataset.driverAction;
      await setDoc(doc(db, 'drivers', button.dataset.uid), { status, reviewedAt: serverTimestamp(), reviewedBy: auth.currentUser.uid }, { merge: true });
      await setDoc(doc(db, 'users', button.dataset.uid), { driverStatus: status }, { merge: true });
      showMessage(status === 'approved' ? 'Transporte aprovado e disponível no mapa.' : `Transporte marcado como ${status}.`, 'success');
    } catch (error) { button.disabled = false; showMessage(`Não foi possível actualizar o transporte.`, 'error'); }
  }));
}

function subscribeDrivers() {
  const pending = query(collection(db, 'drivers'), where('status', '==', 'pending'));
  onSnapshot(pending, (snapshot) => {
    const root = document.querySelector('#pending-drivers');
    document.querySelector('#pending-count').textContent = snapshot.size;
    if (root) root.innerHTML = snapshot.empty ? '<p class="muted-copy">Sem cadastros pendentes.</p>' : snapshot.docs.map((item) => driverCard(item.data(), `<span><button class="btn btn-primary" data-driver-action="approved" data-uid="${escapeHtml(item.id)}">Aprovar</button> <button class="btn btn-ghost" data-driver-action="rejected" data-uid="${escapeHtml(item.id)}">Recusar</button></span>`)).join('');
    bindButtons(root);
  }, (error) => showMessage(`Não foi possível ler os transportes.`, 'error'));

  const approved = query(collection(db, 'drivers'), where('status', '==', 'approved'));
  onSnapshot(approved, (snapshot) => {
    const root = document.querySelector('#approved-drivers');
    if (root) root.innerHTML = snapshot.empty ? '<p class="muted-copy">Nenhum transporte aprovado.</p>' : snapshot.docs.map((item) => driverCard(item.data(), `<button class="btn btn-ghost" data-driver-action="suspended" data-uid="${escapeHtml(item.id)}">Suspender</button>`)).join('');
    bindButtons(root);
  }, (error) => showMessage(`Não foi possível ler transportes aprovados.`, 'error'));
}

function subscribeAlerts() {
  onSnapshot(collection(db, 'sosAlerts'), (snapshot) => {
    document.querySelector('#alert-count').textContent = snapshot.size;
    const root = document.querySelector('#alerts-list');
    if (root) root.innerHTML = snapshot.empty ? '<p class="muted-copy">Sem alertas registados.</p>' : snapshot.docs.slice(0, 8).map((item) => `<article class="driver-card"><strong>${escapeHtml(item.data().type || 'SOS')}</strong><small>${escapeHtml(item.data().phone || 'Sem telefone')} · ${escapeHtml(item.data().createdAt?.toDate?.().toLocaleString('pt-PT') || 'agora')}</small></article>`).join('');
  }, (error) => showMessage(`Não foi possível ler os alertas.`, 'error'));
}

function subscribeAdmins(principal) {
  if (!principal) return;
  onSnapshot(query(collection(db, 'users'), where('role', '==', 'admin')), (snapshot) => {
    const root = document.querySelector('#admins-list');
    if (!root) return;
    root.innerHTML = snapshot.docs.map((item) => { const admin = item.data(); const isPrincipal = admin.email?.toLowerCase() === PRINCIPAL_EMAIL; return `<article class="driver-card"><div class="driver-top"><span class="avatar">${escapeHtml((admin.name || 'A').slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(admin.name || admin.email || item.id)}</strong><small>${escapeHtml(admin.email || '')} · ${isPrincipal ? 'Principal' : 'Administrador'}</small></div></div>${isPrincipal ? '' : `<button class="btn btn-ghost" data-remove-admin="${escapeHtml(item.id)}">Remover administrador</button>`}</article>`; }).join('');
    root.querySelectorAll('[data-remove-admin]').forEach((button) => button.addEventListener('click', async () => { if (!window.confirm('Remover este administrador?')) return; try { await deleteDoc(doc(db, 'users', button.dataset.removeAdmin)); showMessage('Administrador removido.', 'success'); } catch (error) { showMessage('Não foi possível remover o administrador.', 'error'); } }));
  }, (error) => showMessage(`Não foi possível ler administradores.`, 'error'));
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#admin-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await setDoc(doc(db, 'users', data.uid.trim()), { role: 'admin', active: true, name: data.name, email: data.email.toLowerCase(), createdAt: serverTimestamp() }, { merge: true }); showMessage('Administrador autorizado. A conta correspondente já deve existir.', 'success'); event.currentTarget.reset(); }
    catch (error) { showMessage('Não foi possível autorizar o administrador.', 'error'); }
  });
  window.addEventListener('rota:admin-ready', (event) => { subscribeDrivers(); subscribeAlerts(); subscribeAdmins(Boolean(event.detail?.principal)); }, { once: true });
});
