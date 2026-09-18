import { INITIAL_PRODUCTS } from '../data/initialProducts.js';
import { 
  pushProductsToCloud, 
  pushSpecialOfferToCloud, 
  pushOrdersToCloud 
} from './cloudSync.js';

const PRODUCTS_KEY = 'zoom_market_products_v1';
const EMAIL_CONFIG_KEY = 'zoom_market_email_config_v1';
const SPECIAL_OFFER_KEY = 'zoom_market_special_offer_v1';
const ORDERS_KEY = 'zoom_market_orders_v1';
const CATALOG_BUILD_VERSION_KEY = 'zoom_market_catalog_version_v1';
const CURRENT_CATALOG_VERSION = '2026.09.18-v12-ar-default-ugg-exclusive';

// Default Initial Special Offer
export const DEFAULT_SPECIAL_OFFER = {
  enabled: true,
  tagline: "عرض خاص 24 ساعة",
  seasonBadge: "وصول حصري للموسم",
  title: "Chaussures UGG",
  titleAr: "حذاء UGG نسائي أنيق وعصري",
  price: 5900,
  oldPrice: 7500,
  category: "Mode & Habillement",
  description: `✨ Chaussures UGG pour femme – Élégance & Confort Moderne ✨

L'alliance parfaite entre bien-être absolu, chaleur et style tendance pour votre quotidien.

Conception orthopédique : Semelle ergonomique ultra-confortable, idéale pour la marche et un usage quotidien sans fatigue.

Couleurs disponibles :
- 🤍 Beige
- 🤎 Marron
- 🖤 Noir

Pointures : Du 37 au 40

Livraison : Rapide et disponible directement à domicile 🚚
Paiement : À la réception après vérification de votre commande 🤝
📞 Pour commander ou pour toute information : 0663 08 50 69`,
  descriptionAr: `✨ حذاء UGG نسائي أنيق وعصري ✨

يجمع بين الراحة الفائقة، المظهر العصري الجذاب، والدفء المثالي لإطلالتك اليومية.

تصميم طبي (Orthopédique): نعل مريح ومثالي للمشي والاستعمال اليومي دون تعب.

• الألوان المتوفرة :
🤍 بيج (Beige)
🤎 بني (Marron)
🖤 أسود (Noir)

• المقاسات المتوفرة : من 37 إلى 40
• التوصيل : متوفر وسريع حتى باب المنزل 🚚
• الدفع : عند الاستلام بعد معاينة المنتج 🤝
📞 للطلب والاستفسار، يرجى الاتصال أو إرسال رسالة عبر واتساب: 0663085069`,
  images: [
    "./products/ugg-1.jpg",
    "./products/ugg-2.jpg",
    "./products/ugg-3.jpg",
    "./products/ugg-4.jpg",
    "./products/ugg-5.jpg",
    "./products/ugg-6.jpg",
    "./products/ugg-7.jpg",
    "./products/ugg-8.jpg"
  ],
  colors: ["Beige", "Marron", "Noir"],
  colorImageMap: {
    "Beige": 0,
    "Marron": 6,
    "Noir": 3
  },
  productId: "prod-ugg",
  countdownHours: 24
};



// Load products from localStorage or fallback to initial dataset
export function getStoredProducts() {
  try {
    const cachedVersion = localStorage.getItem(CATALOG_BUILD_VERSION_KEY);
    // Automatic cache invalidation: if a new version was deployed, load fresh catalog!
    if (cachedVersion !== CURRENT_CATALOG_VERSION) {
      localStorage.setItem(CATALOG_BUILD_VERSION_KEY, CURRENT_CATALOG_VERSION);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }

    const data = localStorage.getItem(PRODUCTS_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any legacy demo mock products (prod-1 to prod-9)
        const cleaned = parsed.filter(p => p.id === 'prod-ugg' || !/^prod-[1-9]$/.test(p.id));
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch (e) {
    console.error('Error reading products from localStorage:', e);
  }
  saveProducts(INITIAL_PRODUCTS, false);
  return INITIAL_PRODUCTS;
}

// Save products list to localStorage and push to Cloud
export function saveProducts(products, syncCloud = true) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(CATALOG_BUILD_VERSION_KEY, CURRENT_CATALOG_VERSION);
    if (syncCloud) {
      pushProductsToCloud(products);
    }
  } catch (e) {
    console.error('Error saving products to localStorage:', e);
  }
}

// Reset products to default initial dataset
export function resetStoredProducts() {
  saveProducts(INITIAL_PRODUCTS, true);
  return INITIAL_PRODUCTS;
}

// Special Offer Storage
export function getStoredSpecialOffer() {
  try {
    const cachedVersion = localStorage.getItem(CATALOG_BUILD_VERSION_KEY);
    if (cachedVersion !== CURRENT_CATALOG_VERSION) {
      saveSpecialOffer(DEFAULT_SPECIAL_OFFER, false);
      return DEFAULT_SPECIAL_OFFER;
    }
    const data = localStorage.getItem(SPECIAL_OFFER_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && (parsed.productId === 'prod-1' || !parsed.productId || !parsed.title || (parsed.title && parsed.title.toLowerCase().includes('écouteur')))) {
        saveSpecialOffer(DEFAULT_SPECIAL_OFFER, false);
        return DEFAULT_SPECIAL_OFFER;
      }
      return { ...DEFAULT_SPECIAL_OFFER, ...parsed };
    }
  } catch (e) {
    console.error('Error reading special offer:', e);
  }
  saveSpecialOffer(DEFAULT_SPECIAL_OFFER, false);
  return DEFAULT_SPECIAL_OFFER;
}

export function saveSpecialOffer(offer, syncCloud = true) {
  try {
    localStorage.setItem(SPECIAL_OFFER_KEY, JSON.stringify(offer));
    if (syncCloud) {
      pushSpecialOfferToCloud(offer);
    }
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

export function saveOrders(orders, syncCloud = true) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    if (syncCloud) {
      pushOrdersToCloud(orders);
    }
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
  serviceId: 'service_qimlkf2',
  templateId: 'template_8kqlxnb',
  publicKey: 'm2KUiibksRpDB6DOG',
  recipientEmail: 'marketdzzoom@gmail.com',
  storePhone: '+213663085069',
  formspreeEndpoint: ''
};

export function getStoredEmailConfig() {
  try {
    const data = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const merged = {
        serviceId: parsed.serviceId?.trim() || DEFAULT_EMAIL_CONFIG.serviceId,
        templateId: parsed.templateId?.trim() || DEFAULT_EMAIL_CONFIG.templateId,
        publicKey: parsed.publicKey?.trim() || DEFAULT_EMAIL_CONFIG.publicKey,
        recipientEmail: parsed.recipientEmail?.trim() || DEFAULT_EMAIL_CONFIG.recipientEmail,
        storePhone: (!parsed.storePhone || parsed.storePhone === '0550000000' || parsed.storePhone === '0550 00 00 00')
          ? DEFAULT_EMAIL_CONFIG.storePhone
          : parsed.storePhone,
        formspreeEndpoint: parsed.formspreeEndpoint || DEFAULT_EMAIL_CONFIG.formspreeEndpoint
      };
      // Auto-save migrated config to prevent empty keys on mobile or laptop
      if (!parsed.serviceId || !parsed.publicKey || !parsed.templateId || parsed.storePhone === '0550000000') {
        localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(merged));
      }
      return merged;
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
