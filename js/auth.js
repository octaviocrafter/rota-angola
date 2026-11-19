import {
  auth, db, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile, doc, setDoc,
  getDoc, collection, addDoc, serverTimestamp
} from '../db/firebase.js';

const PRINCIPAL_EMAIL = 'octaviomagrelo940@gmail.com';
const $ = (selector, root = document) => root.querySelector(selector);
const clean = (value) => String(value || '').trim();

function showMessage(message, type = 'info') {
  let box = $('#auth-message');
  if (!box) {
    box = document.createElement('div');
    box.id = 'auth-message';
    box.className = 'safety-strip';
    document.querySelector('main')?.prepend(box);
  }
  box.dataset.type = type;
  box.innerHTML = `<span class="safety-icon">${type === 'error' ? '!' : '✓'}</span><div>${message}</div>`;
}

function emailFromForm(form) {
  return clean(form.querySelector('[name="email"]')?.value).toLowerCase();
}

async function registerProfile(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const email = clean(data.email).toLowerCase();
  const password = clean(data.password);
  if (!email || password.length < 6) throw new Error('Use um e-mail válido e uma palavra-passe com pelo menos 6 caracteres.');

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const role = form.dataset.profile === 'driver' ? 'driver' : 'passenger';
  const profile = {
    uid, role, active: true, name: clean(data.name), phone: clean(data.phone),
    alternatePhone: clean(data.alternatePhone), emergencyContact: clean(data.emergencyContact),
    createdAt: serverTimestamp()
  };
  if (role === 'driver') {
    Object.assign(profile, {
      driverType: clean(data.driverType), biNumber: clean(data.biNumber), licenseNumber: clean(data.licenseNumber),
      vehicleBrand: clean(data.vehicleBrand), vehicleModel: clean(data.vehicleModel), vehicleColor: clean(data.vehicleColor),
      plate: clean(data.plate), vehicleYear: clean(data.vehicleYear), seats: Number(data.seats || 0),
      route: clean(data.route), line: clean(data.line), status: 'pending', locationSharing: false
    });
  }
  await setDoc(doc(db, 'users', uid), profile);
  if (role === 'driver') await setDoc(doc(db, 'drivers', uid), { ...profile, updatedAt: serverTimestamp() });
  await updateProfile(credential.user, { displayName: profile.name });
  showMessage('Conta criada. O cadastro foi guardado no Firestore e o motorista aguarda aprovação.', 'success');
  form.reset();
}

async function loginForm(form) {
  const email = emailFromForm(form);
  const password = clean(form.querySelector('[name="password"]')?.value);
  await signInWithEmailAndPassword(auth, email, password);
  // O perfil no Firestore decide o painel; o navegador não escolhe permissões.
  const profile = await getDoc(doc(db, 'users', auth.currentUser.uid));
  const role = profile.exists() ? profile.data().role : '';
  const redirect = form.dataset.redirect || (role === 'driver' ? 'painel-motorista.html' : role === 'passenger' ? 'painel-passageiro.html' : role === 'admin' ? 'painel-admin.html' : '../');
  window.location.href = redirect;
}

function bindForms() {
  document.querySelectorAll('[data-rota-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try { await registerProfile(form); }
    catch (error) { showMessage(error.code === 'auth/email-already-in-use' ? 'Este e-mail já tem uma conta. Use o login.' : (error.message || 'Não foi possível concluir o cadastro.'), 'error'); }
    finally { if (button) button.disabled = false; }
  }));
  document.querySelectorAll('[data-login-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try { await loginForm(form); }
    catch (error) { showMessage(error.code === 'auth/invalid-credential' ? 'E-mail ou palavra-passe incorrectos.' : (error.message || 'Não foi possível iniciar sessão.'), 'error'); }
  }));
  document.querySelectorAll('[data-logout]').forEach((button) => button.addEventListener('click', () => signOut(auth).then(() => { window.location.href = '../'; })));
}

async function guardAdminPage() {
  if (!document.body.dataset.adminPage) return;
  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '../pages/login-admin.html'; return; }
    const profile = await getDoc(doc(db, 'users', user.uid));
    const data = profile.exists() ? profile.data() : {};
    const principal = user.email?.toLowerCase() === PRINCIPAL_EMAIL;
    if (data.role !== 'admin' && !principal) { await signOut(auth); window.location.href = '../pages/login-admin.html?erro=sem-permissao'; return; }
    document.querySelectorAll('[data-admin-email]').forEach((node) => { node.textContent = user.email || ''; });
    document.querySelectorAll('[data-principal-only]').forEach((node) => { node.hidden = !principal; });
    document.body.dataset.adminRole = principal ? 'principal' : 'admin';
    window.dispatchEvent(new CustomEvent('rota:admin-ready', { detail: { user, principal, profile: data } }));
  });
}

bindForms();
guardAdminPage();
export { PRINCIPAL_EMAIL, showMessage, auth, db, addDoc, collection, serverTimestamp };
