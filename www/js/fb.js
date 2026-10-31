import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config.js';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Long polling avoids connection problems inside the Android WebView.
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
