// Paste the values from Firebase console -> Project settings -> Your apps -> Web app.
export const firebaseConfig = {
  apiKey: 'AIzaSyBRxo3UytsMwhQvXqQywg0UJDrPppgp_yM',
  authDomain: 'parts-shop-2b930.firebaseapp.com',
  projectId: 'parts-shop-2b930',
  storageBucket: 'parts-shop-2b930.firebasestorage.app',
  messagingSenderId: '575088996944',
  appId: '1:575088996944:web:523696bce70205118b5755'
};
export const MAX_CUSTOMERS = 50; // trial cap, enforced in the owner's app
export const configured = () => !String(firebaseConfig.apiKey).startsWith('PASTE');
