import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, deleteUser, sendPasswordResetEmail, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Mantém o utilizador autenticado entre páginas e reaberturas até escolher Terminar sessão.
setPersistence(auth, browserLocalPersistence).catch((error) => console.warn('[ROTA] persistência local indisponível:', error));
export { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, deleteUser, sendPasswordResetEmail, setPersistence, browserLocalPersistence, doc, setDoc, getDoc, deleteDoc, collection, addDoc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp };
