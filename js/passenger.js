import { auth, db, onAuthStateChanged, collection, query, where, onSnapshot } from '../db/firebase.js';

// PASSAGEIRO: mostra reservas em tempo real e só revela o telefone completo após confirmação.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const maskPhone = (phone) => { const value = String(phone || ''); return value.length > 6 ? `${value.slice(0, 3)} *** ${value.slice(-3)}` : 'Contacto protegido'; };
const whatsappNumber = (phone) => { const digits = String(phone || '').replace(/\D/g, ''); return digits.startsWith('244') ? digits : `244${digits.replace(/^0/, '')}`; };
const statusLabel = { requested: 'Pendente de confirmação', confirmed: 'Confirmada', cancelled: 'Cancelada' };

function renderReservations(snapshot) {
  const root = document.querySelector('#reservations-list');
  if (!root) return;
  if (snapshot.empty) { root.innerHTML = '<p class="muted-copy">Ainda não tem reservas. Escolha um transporte aprovado no mapa.</p>'; return; }
  root.innerHTML = snapshot.docs.map((item) => {
    const reservation = item.data();
    const confirmed = reservation.status === 'confirmed';
    const phone = confirmed ? escapeHtml(reservation.driverPhone || 'Não indicado') : maskPhone(reservation.driverPhone);
    return `<article class="driver-card"><div class="driver-top"><span class="avatar">${escapeHtml((reservation.driverName || 'M').slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(reservation.ticketNumber)}</strong><small>${escapeHtml(statusLabel[reservation.status] || reservation.status)} · ${escapeHtml(reservation.driverName)}</small></div></div><div class="driver-meta"><span>${escapeHtml(reservation.from)} → ${escapeHtml(reservation.to)}</span><span>Lugar ${escapeHtml(reservation.seat)}</span></div><div class="driver-meta"><span>${escapeHtml(reservation.date)} · ${escapeHtml(reservation.time)}</span><span>${escapeHtml(reservation.plate)} · ${escapeHtml(reservation.color)}</span></div><div class="driver-meta"><span>Motorista: ${phone}</span>${confirmed && reservation.driverPhone ? `<a class="btn btn-ghost" href="tel:${escapeHtml(reservation.driverPhone)}">Ligar</a><a class="btn btn-ghost" href="https://wa.me/${encodeURIComponent(whatsappNumber(reservation.driverPhone))}" target="_blank" rel="noopener">WhatsApp</a>` : '<span>Contacto protegido</span>'}</div></article>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.dataset.passengerPage) return;
  onAuthStateChanged(auth, (user) => {
    if (!user) { window.location.href = '../pages/login.html'; return; }
    const reservations = query(collection(db, 'reservations'), where('passengerId', '==', user.uid));
    onSnapshot(reservations, renderReservations, () => { const root = document.querySelector('#reservations-list'); if (root) root.innerHTML = '<p class="muted-copy">Não foi possível carregar os bilhetes agora.</p>'; });
  });
});
