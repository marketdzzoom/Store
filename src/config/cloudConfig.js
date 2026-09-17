/**
 * Zoom Market Dz - Cloud Synchronization Configuration
 * 
 * You can set your Firebase Realtime Database URL here, or pass it via:
 * - VITE_FIREBASE_DATABASE_URL environment variable
 * - The Admin Panel UI ("☁️ Synchro Cloud" tab)
 * - Smartphone pairing link (?sync_db=...)
 */

export const DEFAULT_CLOUD_CONFIG = {
  // Example: "https://zoom-market-dz-default-rtdb.firebaseio.com"
  firebaseUrl: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_DATABASE_URL) || '',
  authSecret: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_SECRET) || '',
  enabled: true,
  autoSync: true
};
