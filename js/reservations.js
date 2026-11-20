import { auth, db, addDoc, collection, getDoc, doc, serverTimestamp } from '../db/firebase.js';

// RESERVAS: não existe pagamento online. O bilhete é textual e o pagamento acontece no veículo.
const clean = (value) => String(value || '').trim();
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

function showTicket(title, reservation) {
  const modal = document.querySelector('#modal');
  const content = document.querySelector('#modal-content');
  if (!modal || !content) { window.alert(`Bilhete ${reservation.ticketNumber} criado.`); return; }
  content.innerHTML = `<h3>${escapeHtml(title)}</h3><div class="driver-card"><strong>${escapeHtml(reservation.ticketNumber)}</strong><small>${escapeHtml(reservation.from)} → ${escapeHtml(reservation.to)}</small><div class="driver-meta"><span>Data: ${escapeHtml(reservation.date)} · Hora: ${escapeHtml(reservation.time)}</span><span>Lugar: ${escapeHtml(reservation.seat)}</span></div><div class="driver-meta"><span>${escapeHtml(reservation.plate)} · ${escapeHtml(reservation.color)}</span><span>A pagar no local</span></div></div><p class="muted-copy">Mostre este número ao motorista no embarque. A reserva aguarda confirmação.</p>`;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
}

async function reserveDriver(driver) {
  if (!auth.currentUser) { window.location.href = 'pages/login.html'; return; }
  const profileSnapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
  const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
  if (profile.role && profile.role !== 'passenger') { window.alert('Entre com uma conta de passageiro para reservar um lugar.'); return; }
  const from = clean(window.prompt('De onde parte?'));
  const to = clean(window.prompt('Para onde vai?'));
  const seat = clean(window.prompt('Número do lugar pretendido (ex.: 04)'));
  if (!from || !to || !seat) return;
  const now = new Date();
  const ticketNumber = `ROTA-${now.getFullYear()}-${String(Date.now()).slice(-5)}`;
  const reservation = { ticketNumber, passengerId: auth.currentUser.uid, passengerName: profile.name || auth.currentUser.displayName || 'Passageiro', passengerPhone: profile.phone || '', driverId: driver.id, driverName: driver.name, driverPhone: driver.phone || '', from, to, date: now.toLocaleDateString('pt-PT'), time: now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }), seat, plate: driver.plate || '—', color: driver.color || '—', status: 'requested', createdAt: serverTimestamp() };
  const created = await addDoc(collection(db, 'reservations'), reservation);
  showTicket('Bilhete criado', { ...reservation, id: created.id });
}

window.reserveDriver = reserveDriver;
export { reserveDriver };
