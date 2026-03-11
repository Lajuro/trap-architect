// ============================================================
// TRAP ARCHITECT - FIREBASE CONFIGURATION
// Firebase initialization and service exports
// ============================================================

// Firebase configuration — replace with your project's config
const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDB = null;

function initFirebase() {
  if (firebaseApp) return;
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded');
    return;
  }
  firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
  firebaseAuth = firebase.auth();
  firebaseDB = firebase.firestore();

  // Enable offline persistence for better UX
  firebaseDB.enablePersistence({ synchronizeTabs: true }).catch(() => {});
}
