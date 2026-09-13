import { INITIAL_PRODUCTS } from '../data/initialProducts';

const PRODUCTS_KEY = 'zoom_market_products_v1';
const EMAIL_CONFIG_KEY = 'zoom_market_email_config_v1';
const SPECIAL_OFFER_KEY = 'zoom_market_special_offer_v1';
const ORDERS_KEY = 'zoom_market_orders_v1';

// Default Initial Special Offer
export const DEFAULT_SPECIAL_OFFER = {
  enabled: true,
  tagline: "Vente Flash 24H ⚡",
  seasonBadge: "Arrivage Spécial Saison",
  title: "Écouteurs Sans Fil Active Noise Cancelling Pro",
  titleAr: "سماعات لاسلكية عازلة للضوضاء Pro",
  price: 5800,
  oldPrice: 7800,
  category: "High-Tech",
  description: "Offre exceptionnelle limitée ! Écouteurs bluetooth haute fidélité avec réduction active du bruit (ANC), autonomie 28h et coffret premium.",
  descriptionAr: "عرض خاص محدود! سماعات بلوتوث عالية الدقة مع إلغاء الضوضاء النشط وبطارية 28 ساعة.",
  images: [
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
  ],
  productId: "prod-1",
  countdownHours: 24
};

// Load products from localStorage or fallback to initial dataset
export function getStoredProducts() {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading products from localStorage:', e);
  }
  saveProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

// Save products list to localStorage
export function saveProducts(products) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage:', e);
  }
}

// Reset products to default initial dataset
export function resetStoredProducts() {
  saveProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

// Special Offer Storage
export function getStoredSpecialOffer() {
  try {
    const data = localStorage.getItem(SPECIAL_OFFER_KEY);
    if (data) {
      return { ...DEFAULT_SPECIAL_OFFER, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error reading special offer:', e);
  }
  saveSpecialOffer(DEFAULT_SPECIAL_OFFER);
  return DEFAULT_SPECIAL_OFFER;
}

export function saveSpecialOffer(offer) {
  try {
    localStorage.setItem(SPECIAL_OFFER_KEY, JSON.stringify(offer));
  } catch (e) {
    console.error('Error saving special offer:', e);
  }
}

// Client Orders LocalStorage Management
export function getStoredOrders() {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading orders from localStorage:', e);
  }
  return [];
}

export function saveOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders to localStorage:', e);
  }
}

export function addOrderToStorage(orderData) {
  const currentOrders = getStoredOrders();
  const newOrder = {
    id: `ORD-${Date.now()}`,
    status: 'En attente', // 'En attente', 'Validé', 'Livré', 'Annulé'
    createdAt: new Date().toISOString(),
    ...orderData
  };
  const updated = [newOrder, ...currentOrders];
  saveOrders(updated);
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('zoom_market_order_created', { detail: newOrder }));
    } catch (e) {
      // Ignore if unsupported
    }
  }
  return updated;
}

export function updateOrderStatus(orderId, newStatus) {
  const currentOrders = getStoredOrders();
  const updated = currentOrders.map((ord) => 
    ord.id === orderId ? { ...ord, status: newStatus } : ord
  );
  saveOrders(updated);
  return updated;
}

export function deleteOrderFromStorage(orderId) {
  const currentOrders = getStoredOrders();
  const updated = currentOrders.filter((ord) => ord.id !== orderId);
  saveOrders(updated);
  return updated;
}

// Default EmailJS Configuration
export const DEFAULT_EMAIL_CONFIG = {
  serviceId: '',
  templateId: '',
  publicKey: '',
  recipientEmail: 'marketdzzoom@gmail.com',
  storePhone: '0550000000',
  formspreeEndpoint: ''
};

export function getStoredEmailConfig() {
  try {
    const data = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (data) {
      return { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error reading email config from localStorage:', e);
  }
  return DEFAULT_EMAIL_CONFIG;
}

export function saveEmailConfig(config) {
  try {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving email config to localStorage:', e);
  }
}
