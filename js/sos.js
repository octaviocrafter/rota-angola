import { auth, db, addDoc, collection, serverTimestamp } from '../db/firebase.js';

function getEmergencyNumber() { return localStorage.getItem('rota-emergency-number') || '112'; }
function setupSos() { document.querySelectorAll('[data-sos]').forEach((button) => button.addEventListener('click', async () => { const phone = getEmergencyNumber(); const user = auth.currentUser; try { if (user) await addDoc(collection(db, 'sosAlerts'), { userId: user.uid, type: 'manual', phone, createdAt: serverTimestamp(), source: 'ROTA-web' }); } catch (_) { /* A chamada continua mesmo sem registo online. */ } window.location.href = `tel:${phone}`; })); }
document.addEventListener('DOMContentLoaded', setupSos);
