import { db, collection, query, where, onSnapshot } from '../db/firebase.js';

// MAPA: estes dados só aparecem quando não existem transportes aprovados no Firestore.
const DEMO_DRIVERS = [
  { id: 'demo-1', type: 'Autocarro', name: 'Demonstração ROTA', initials: 'DR', route: 'Gamek → Maianga', destination: 'Gamek', plate: 'DEMO-00-00', color: 'Azul', minutes: 8, lat: -8.884, lon: 13.289, verified: false, demo: true }
];

let rotaMap;
let rotaMarkers = [];
let liveDrivers = [];
let userPosition = null;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

function driverIcon(kind) {
  return L.divIcon({ className: 'rota-pin', html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${kind === 'Autocarro' ? '#2f79ff' : '#ff7a18'};border:3px solid white;box-shadow:0 4px 12px #07111f55"><span style="display:block;transform:rotate(45deg);text-align:center;color:#07111f;font-weight:900;line-height:28px">${kind === 'Autocarro' ? '▣' : '◈'}</span></div>`, iconSize: [34, 34], iconAnchor: [17, 34] });
}

function normalise(item) {
  const data = item.data ? item.data() : item;
  return { ...data, id: item.id || data.uid, initials: (data.name || '?').slice(0, 2).toUpperCase(), type: data.driverType || data.type || 'Transporte Privado', route: data.route || 'Localização partilhada', destination: data.destination || data.route || '', plate: data.plate || '—', color: data.vehicleColor || data.color || '—', lat: Number(data.lat ?? data.latitude), lon: Number(data.lon ?? data.longitude), demo: false };
}

// ETA: calcula uma faixa estatística, não uma promessa. Usa distância em linha recta,
// factor médio de estrada e velocidade média por tipo de transporte.
function distanceKm(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const toRadians = (value) => value * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateArrival(driver) {
  if (Number.isFinite(driver.lat) && Number.isFinite(driver.lon) && userPosition) {
    const straightDistance = distanceKm(userPosition.lat, userPosition.lon, driver.lat, driver.lon);
    const roadDistance = straightDistance * 1.25;
    const averageSpeed = driver.type === 'Autocarro' ? 22 : 30;
    const centralMinutes = Math.max(1, Math.ceil((roadDistance / averageSpeed) * 60));
    const low = Math.max(1, Math.round(centralMinutes * 0.8));
    const high = Math.max(low + 1, Math.round(centralMinutes * 1.25));
    return { label: `${low}–${high} min`, distance: `${roadDistance.toFixed(1)} km`, detail: 'estimativa estatística' };
  }
  if (driver.demo && Number.isFinite(driver.minutes)) return { label: `~${driver.minutes} min`, distance: 'demonstração', detail: 'estimativa demonstrativa' };
  return { label: 'Permita o GPS', distance: '—', detail: 'necessita da sua localização' };
}

function renderDrivers(list = liveDrivers.length ? liveDrivers : DEMO_DRIVERS) {
  const root = document.querySelector('#driver-list');
  if (!root) return;
  root.innerHTML = list.map((driver) => {
    const eta = estimateArrival(driver);
    return `<article class="driver-card" data-driver="${escapeHtml(driver.id)}"><div class="driver-top"><span class="avatar">${escapeHtml(driver.initials)}</span><div><strong>${escapeHtml(driver.name)}</strong><small>${escapeHtml(driver.type)} · ${escapeHtml(driver.route)}</small></div></div><div class="driver-meta"><span>Chegada: ${escapeHtml(eta.label)} · ${escapeHtml(eta.distance)}</span><span class="plate">${escapeHtml(driver.plate)}</span></div></article>`;
  }).join('');
  root.querySelectorAll('[data-driver]').forEach((element) => element.addEventListener('click', () => focusDriver(element.dataset.driver)));
  const count = document.querySelector('#result-count');
  if (count) count.textContent = list.length;
}

function focusDriver(id) {
  const driver = liveDrivers.concat(DEMO_DRIVERS).find((item) => String(item.id) === String(id));
  if (!driver || !rotaMap || !Number.isFinite(driver.lat)) return;
  rotaMap.setView([driver.lat, driver.lon], 14);
  rotaMarkers.find((marker) => String(marker.options.driverId) === String(id))?.openPopup();
}

window.filterDrivers = (queryText) => {
  const queryValue = String(queryText || '').trim().toLowerCase();
  const source = liveDrivers.length ? liveDrivers : DEMO_DRIVERS;
  const list = queryValue ? source.filter((driver) => `${driver.destination} ${driver.route} ${driver.name}`.toLowerCase().includes(queryValue)) : source;
  renderDrivers(list);
  const title = document.querySelector('#result-title');
  if (title) title.textContent = queryValue ? `A caminho de ${queryText}` : 'Na sua zona';
};

function drawMarkers() {
  rotaMarkers.forEach((marker) => marker.remove());
  const source = liveDrivers.length ? liveDrivers : DEMO_DRIVERS;
  rotaMarkers = source.filter((driver) => Number.isFinite(driver.lat) && Number.isFinite(driver.lon)).map((driver) => {
    const eta = estimateArrival(driver);
    const marker = L.marker([driver.lat, driver.lon], { icon: driverIcon(driver.type) }).addTo(rotaMap).bindPopup(`<strong>${escapeHtml(driver.name)}</strong><br>${escapeHtml(driver.type)}<br><b>${escapeHtml(driver.route)}</b><br>${escapeHtml(driver.plate)} · ${escapeHtml(driver.color)}<br>Chegada: ${escapeHtml(eta.label)} (${escapeHtml(eta.detail)})${driver.demo ? '<br><em>Demonstração local</em>' : ''}`);
    marker.options.driverId = driver.id;
    return marker;
  });
  renderDrivers();
}

function subscribeLiveDrivers() {
  // Apenas motoristas aprovados são lidos no mapa público.
  const approved = query(collection(db, 'drivers'), where('status', '==', 'approved'));
  onSnapshot(approved, (snapshot) => {
    liveDrivers = snapshot.docs.map(normalise);
    drawMarkers();
    document.querySelector('#location-copy').textContent = liveDrivers.length ? 'Transportes aprovados · dados Firestore' : 'Sem transportes activos';
  }, () => {
    liveDrivers = [];
    drawMarkers();
    document.querySelector('#location-copy').textContent = 'Modo demonstração · sem ligação Firestore';
  });
}

function initMap() {
  if (!window.L || !document.querySelector('#map')) return;
  rotaMap = L.map('map', { zoomControl: false }).setView([-8.86, 13.25], 12);
  L.control.zoom({ position: 'bottomright' }).addTo(rotaMap);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(rotaMap);
  drawMarkers();
  subscribeLiveDrivers();
  if (navigator.geolocation) navigator.geolocation.getCurrentPosition((position) => {
    userPosition = { lat: position.coords.latitude, lon: position.coords.longitude };
    document.querySelector('#location-copy').textContent = 'GPS activo · ETA calculado estatisticamente';
    L.circleMarker([userPosition.lat, userPosition.lon], { radius: 8, color: '#07111f', fillColor: '#ff7a18', fillOpacity: 1 }).addTo(rotaMap).bindPopup('Está aqui');
    drawMarkers();
  }, () => { document.querySelector('#location-copy').textContent = 'Permita o GPS para calcular a chegada'; });
}

document.addEventListener('DOMContentLoaded', initMap);
