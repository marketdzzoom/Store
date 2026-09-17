/**
 * Zoom Market Dz - Real-Time Multi-Device Cloud Synchronization Engine
 * Powered by Zero-Dependency Native Firebase Realtime Database SSE/REST
 * 
 * Features:
 * - Sub-second cross-device synchronization (PC <-> Mobile <-> Customers)
 * - Zero extra bundle size (Uses native browser fetch & EventSource)
 * - 100% compatible with static hosting (GitHub Pages)
 * - Offline-First with automatic local cache fallback
 */

import { DEFAULT_CLOUD_CONFIG } from '../config/cloudConfig.js';

const CLOUD_CONFIG_KEY = 'zoom_market_cloud_config_v1';
const SYNC_EVENT_NAME = 'zoom_market_cloud_sync_event';

/**
 * Auto-detect smartphone pairing parameter in URL (?sync_db=...)
 */
function detectUrlPairingConfig() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const syncDb = params.get('sync_db');
    const syncAuth = params.get('sync_auth');
    if (syncDb) {
      const cleanUrl = normalizeFirebaseUrl(syncDb);
      if (cleanUrl) {
        saveCloudConfig({
          firebaseUrl: cleanUrl,
          authSecret: syncAuth || '',
          enabled: true
        });
        // Clean URL parameter without reloading
        params.delete('sync_db');
        params.delete('sync_auth');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        window.history.replaceState(null, '', window.location.pathname + newSearch + window.location.hash);
      }
    }
  } catch (e) {
    // Ignore error
  }
}
detectUrlPairingConfig();

/**
 * Normalizes Firebase Realtime Database URL
 */
export function normalizeFirebaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let clean = rawUrl.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  clean = clean.replace(/\.json\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

/**
 * Generate a direct pairing link for smartphones
 */
export function generateSmartphoneSyncLink() {
  if (typeof window === 'undefined') return '';
  const config = getCloudConfig();
  if (!config.firebaseUrl) return '';
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('sync_db', config.firebaseUrl);
    if (config.authSecret) {
      url.searchParams.set('sync_auth', config.authSecret);
    }
    return url.toString();
  } catch (e) {
    return `${window.location.origin}${window.location.pathname}?sync_db=${encodeURIComponent(config.firebaseUrl)}`;
  }
}

/**
 * Get current Cloud Sync configuration
 */
export function getCloudConfig() {
  let firebaseUrl = DEFAULT_CLOUD_CONFIG?.firebaseUrl || '';
  let authSecret = DEFAULT_CLOUD_CONFIG?.authSecret || '';
  let enabled = DEFAULT_CLOUD_CONFIG?.enabled ?? true;
  let autoSync = DEFAULT_CLOUD_CONFIG?.autoSync ?? true;
  let lastSyncTime = null;
  let lastSyncStatus = 'idle';

  try {
    const data = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.firebaseUrl) firebaseUrl = parsed.firebaseUrl;
      if (parsed.authSecret !== undefined) authSecret = parsed.authSecret;
      if (parsed.enabled !== undefined) enabled = parsed.enabled;
      if (parsed.autoSync !== undefined) autoSync = parsed.autoSync;
      if (parsed.lastSyncTime) lastSyncTime = parsed.lastSyncTime;
      if (parsed.lastSyncStatus) lastSyncStatus = parsed.lastSyncStatus;
    }
  } catch (e) {
    console.error('Error reading cloud config:', e);
  }

  return {
    enabled,
    firebaseUrl: normalizeFirebaseUrl(firebaseUrl),
    authSecret,
    autoSync,
    lastSyncTime,
    lastSyncStatus
  };
}

/**
 * Save Cloud Sync configuration
 */
export function saveCloudConfig(config) {
  try {
    const existing = getCloudConfig();
    const updated = {
      ...existing,
      ...config,
      firebaseUrl: normalizeFirebaseUrl(config.firebaseUrl || existing.firebaseUrl)
    };
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(updated));
    dispatchSyncEvent({ type: 'config_updated', config: updated });
    return updated;
  } catch (e) {
    console.error('Error saving cloud config:', e);
    return config;
  }
}

/**
 * Dispatches a custom window event for sync state updates
 */
function dispatchSyncEvent(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail }));
  }
}

/**
 * Listen for sync events
 */
export function onSyncEvent(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => callback(e.detail);
  window.addEventListener(SYNC_EVENT_NAME, handler);
  return () => window.removeEventListener(SYNC_EVENT_NAME, handler);
}

/**
 * Test Firebase Realtime Database connection
 */
export async function testFirebaseConnection(rawUrl, authSecret = '') {
  const url = normalizeFirebaseUrl(rawUrl);
  if (!url) {
    return { success: false, error: 'Veuillez saisir une URL Firebase valide.' };
  }

  try {
    const endpoint = `${url}/.json?shallow=true${authSecret ? `&auth=${encodeURIComponent(authSecret)}` : ''}`;
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      return { success: true };
    }

    if (res.status === 401 || res.status === 403) {
      return { 
        success: false, 
        error: 'Permission refusée (401/403). Assurez-vous que les Règles de votre Realtime Database sont configurées sur ".read": true, ".write": true.' 
      };
    }

    return { 
      success: false, 
      error: `Erreur de connexion HTTP ${res.status} (${res.statusText})` 
    };
  } catch (err) {
    return { 
      success: false, 
      error: `Impossible de joindre l'adresse : ${err.message || 'Vérifiez l\'URL et votre connexion.'}` 
    };
  }
}

/**
 * Push all store data (products, specialOffer, orders) to Firebase
 */
export async function pushFullStoreToCloud({ products, specialOffer, orders }) {
  const config = getCloudConfig();
  if (!config.enabled || !config.firebaseUrl) return false;

  const url = normalizeFirebaseUrl(config.firebaseUrl);
  const authParam = config.authSecret ? `?auth=${encodeURIComponent(config.authSecret)}` : '';
  const endpoint = `${url}/zoom_market.json${authParam}`;

  try {
    const payload = {
      products: products || [],
      specialOffer: specialOffer || null,
      orders: orders || [],
      updatedAt: Date.now()
    };

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      saveCloudConfig({
        lastSyncTime: new Date().toISOString(),
        lastSyncStatus: 'synced'
      });
      dispatchSyncEvent({ type: 'push_success', timestamp: Date.now() });
      return true;
    } else {
      console.warn('Firebase push failed with status:', res.status);
      saveCloudConfig({ lastSyncStatus: 'error' });
      return false;
    }
  } catch (err) {
    console.error('Error pushing store data to Cloud:', err);
    saveCloudConfig({ lastSyncStatus: 'error' });
    return false;
  }
}

/**
 * Push products update to Cloud
 */
export async function pushProductsToCloud(products) {
  const config = getCloudConfig();
  if (!config.enabled || !config.firebaseUrl) return false;

  const url = normalizeFirebaseUrl(config.firebaseUrl);
  const authParam = config.authSecret ? `?auth=${encodeURIComponent(config.authSecret)}` : '';
  const endpoint = `${url}/zoom_market/products.json${authParam}`;

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products)
    });

    if (res.ok) {
      saveCloudConfig({
        lastSyncTime: new Date().toISOString(),
        lastSyncStatus: 'synced'
      });
      dispatchSyncEvent({ type: 'push_products_success' });
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error pushing products:', e);
    return false;
  }
}

/**
 * Push special offer update to Cloud
 */
export async function pushSpecialOfferToCloud(offer) {
  const config = getCloudConfig();
  if (!config.enabled || !config.firebaseUrl) return false;

  const url = normalizeFirebaseUrl(config.firebaseUrl);
  const authParam = config.authSecret ? `?auth=${encodeURIComponent(config.authSecret)}` : '';
  const endpoint = `${url}/zoom_market/specialOffer.json${authParam}`;

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
    return res.ok;
  } catch (e) {
    console.error('Error pushing special offer:', e);
    return false;
  }
}

/**
 * Push orders update to Cloud
 */
export async function pushOrdersToCloud(orders) {
  const config = getCloudConfig();
  if (!config.enabled || !config.firebaseUrl) return false;

  const url = normalizeFirebaseUrl(config.firebaseUrl);
  const authParam = config.authSecret ? `?auth=${encodeURIComponent(config.authSecret)}` : '';
  const endpoint = `${url}/zoom_market/orders.json${authParam}`;

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
    return res.ok;
  } catch (e) {
    console.error('Error pushing orders:', e);
    return false;
  }
}

/**
 * Fetch entire cloud store state
 */
export async function fetchCloudStore() {
  const config = getCloudConfig();
  if (!config.enabled || !config.firebaseUrl) return null;

  const url = normalizeFirebaseUrl(config.firebaseUrl);
  const authParam = config.authSecret ? `?auth=${encodeURIComponent(config.authSecret)}` : '';
  const endpoint = `${url}/zoom_market.json${authParam}`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  } catch (err) {
    console.error('Error fetching cloud store:', err);
    return null;
  }
}

/**
 * Starts Real-Time Server-Sent Events (SSE) Listener
 * Connects directly to Firebase Realtime Database stream
 */
export function subscribeToRealtimeSync({
  onProducts,
  onSpecialOffer,
  onOrders,
  onStatusChange = () => {}
}) {
  const config = getCloudConfig();
  if (!config.enabled || !config.firebaseUrl) {
    onStatusChange('unconfigured');
    return () => {};
  }

  const url = normalizeFirebaseUrl(config.firebaseUrl);
  const authParam = config.authSecret ? `?auth=${encodeURIComponent(config.authSecret)}` : '';
  const streamEndpoint = `${url}/zoom_market.json${authParam}`;

  let eventSource = null;
  let isClosed = false;

  // 1. Initial One-Shot Pull to ensure instant freshness
  fetchCloudStore().then((data) => {
    if (data && !isClosed) {
      if (Array.isArray(data.products) && onProducts) {
        onProducts(data.products);
      }
      if (data.specialOffer && onSpecialOffer) {
        onSpecialOffer(data.specialOffer);
      }
      if (Array.isArray(data.orders) && onOrders) {
        onOrders(data.orders);
      }
      onStatusChange('connected');
    }
  }).catch(() => {});

  // 2. Real-Time Streaming via EventSource
  try {
    eventSource = new EventSource(streamEndpoint);

    eventSource.addEventListener('put', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (!payload) return;

        const path = payload.path;
        const data = payload.data;

        if (path === '/' && data && typeof data === 'object') {
          if (Array.isArray(data.products) && onProducts) onProducts(data.products);
          if (data.specialOffer && onSpecialOffer) onSpecialOffer(data.specialOffer);
          if (Array.isArray(data.orders) && onOrders) onOrders(data.orders);
        } else if (path === '/products' || path.startsWith('/products/')) {
          // Products updated
          if (Array.isArray(data) && onProducts) {
            onProducts(data);
          } else {
            // Re-fetch clean list if partial index
            fetchCloudStore().then((full) => {
              if (full && Array.isArray(full.products) && onProducts) {
                onProducts(full.products);
              }
            });
          }
        } else if (path === '/specialOffer' || path.startsWith('/specialOffer/')) {
          if (data && onSpecialOffer) onSpecialOffer(data);
        } else if (path === '/orders' || path.startsWith('/orders/')) {
          if (Array.isArray(data) && onOrders) onOrders(data);
        }

        saveCloudConfig({
          lastSyncTime: new Date().toISOString(),
          lastSyncStatus: 'connected'
        });
        onStatusChange('connected');
      } catch (err) {
        console.error('Error handling SSE put event:', err);
      }
    });

    eventSource.addEventListener('patch', () => {
      // Re-fetch fresh state on patch
      fetchCloudStore().then((data) => {
        if (data && !isClosed) {
          if (Array.isArray(data.products) && onProducts) onProducts(data.products);
          if (data.specialOffer && onSpecialOffer) onSpecialOffer(data.specialOffer);
          if (Array.isArray(data.orders) && onOrders) onOrders(data.orders);
        }
      });
    });

    eventSource.onopen = () => {
      onStatusChange('connected');
    };

    eventSource.onerror = () => {
      onStatusChange('reconnecting');
    };
  } catch (err) {
    console.error('Could not open EventSource stream:', err);
    onStatusChange('error');
  }

  // Cleanup handler
  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
    }
  };
}
