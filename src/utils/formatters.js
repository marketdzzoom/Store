// Format price into DZD / DA standard format (e.g., 5 800 DA)
export function formatPrice(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 DA';
  const formatted = new Intl.NumberFormat('fr-DZ', {
    maximumFractionDigits: 0
  }).format(amount);
  return `${formatted} DA`;
}

/**
 * Normalizes an Algerian phone number into standard 10-digit format (05XXXXXXXX, 06XXXXXXXX, 07XXXXXXXX)
 */
export function normalizeDZPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let clean = phone.trim().replace(/[\s\.\-\(\)\/_]/g, '');
  
  if (clean.startsWith('00213')) {
    clean = '0' + clean.substring(5);
  } else if (clean.startsWith('+213')) {
    clean = '0' + clean.substring(4);
  } else if (clean.startsWith('213') && clean.length >= 11) {
    clean = '0' + clean.substring(3);
  }
  
  return clean;
}

/**
 * Formats a phone number nicely for display (e.g. 0663 08 50 69)
 * Protected with LTR marks and non-breaking characters to prevent Arabic RTL reversal
 */
export function formatDZPhoneDisplay(phone) {
  const clean = normalizeDZPhone(phone);
  if (!clean || clean.length !== 10) return phone || '';
  // Uses \u200E (Left-to-Right Mark) and non-breaking spaces to guarantee 0663 08 50 69 is never inverted in RTL
  return `\u200E${clean.slice(0, 4)}\u00A0${clean.slice(4, 6)}\u00A0${clean.slice(6, 8)}\u00A0${clean.slice(8, 10)}\u200E`;
}

/**
 * Detects the Algerian carrier operator for visual UI feedback
 */
export function getDZPhoneCarrier(phone) {
  const clean = normalizeDZPhone(phone);
  if (!clean || clean.length < 2) return null;
  if (clean.startsWith('05')) return { name: 'Ooredoo', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' };
  if (clean.startsWith('06')) return { name: 'Mobilis', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' };
  if (clean.startsWith('07')) return { name: 'Djezzy', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' };
  return null;
}

/**
 * Validates an Algerian phone number:
 * - Must strictly match 10 digits starting with 05, 06, or 07 (or fixed lines 02, 03, 04)
 * - Anti-fake detection: rejects repeating identical digits (0555555555, 0600000000) and dummy sequences (12345678, etc.)
 */
export function validateDZPhone(phone) {
  const clean = normalizeDZPhone(phone);
  if (!clean) return false;

  // Exact 10 digits starting with 05, 06, or 07 (or landlines 02, 03, 04)
  const regex = /^(0[567]\d{8}|0[234]\d{7,8})$/;
  if (!regex.test(clean)) {
    return false;
  }

  // Reject repeating identical trailing digits (e.g. 0555555555, 0600000000, 0711111111)
  const last8 = clean.slice(-8);
  const uniqueDigits = new Set(last8.split(''));
  if (uniqueDigits.size <= 1) {
    return false;
  }

  // Reject obvious dummy ascending/descending/alternating sequences
  const dummySequences = [
    '12345678', '87654321', '01234567', '76543210',
    '11223344', '00112233', '12121212', '00000000',
    '11112222', '22223333', '00001111'
  ];
  if (dummySequences.includes(last8)) {
    return false;
  }

  return true;
}

// Clean phone for WhatsApp (+213...)
export function formatPhoneForWhatsApp(phone) {
  if (!phone) return '213000000000';
  const clean = normalizeDZPhone(phone);
  if (clean.startsWith('0')) {
    return '213' + clean.substring(1);
  }
  return clean;
}

/**
 * Encodes a product into a compact, URL-safe Base64 string
 * Used to make marketing landing page links completely self-contained
 * so ANY customer clicking from Facebook / TikTok / WhatsApp sees the exact
 * product immediately, even if it hasn't been committed to GitHub yet!
 */
export function encodeProductForUrl(product) {
  if (!product || typeof product !== 'object') return '';
  try {
    const minified = {
      id: product.id,
      title: product.title,
      price: product.price
    };
    if (product.titleAr) minified.titleAr = product.titleAr;
    if (product.oldPrice) minified.oldPrice = product.oldPrice;
    if (product.category) minified.category = product.category;
    if (product.badge) minified.badge = product.badge;
    if (product.description) minified.description = product.description;
    if (product.descriptionAr) minified.descriptionAr = product.descriptionAr;

    // Only include external URLs (do not blow up URL with large local data URIs)
    if (product.image && typeof product.image === 'string' && !product.image.startsWith('data:')) {
      minified.image = product.image;
    }
    if (Array.isArray(product.images)) {
      const webImages = product.images.filter(img => typeof img === 'string' && !img.startsWith('data:'));
      if (webImages.length > 0) {
        minified.images = webImages.slice(0, 4);
      }
    }
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      minified.colors = product.colors;
    }
    if (product.colorImageMap && typeof product.colorImageMap === 'object') {
      minified.colorImageMap = product.colorImageMap;
    }
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      minified.sizes = product.sizes;
    }
    if (product.stockQuantity !== undefined) minified.stockQuantity = product.stockQuantity;
    if (product.inStock !== undefined) minified.inStock = product.inStock;
    if (product.rating) minified.rating = product.rating;
    if (product.reviewsCount) minified.reviewsCount = product.reviewsCount;

    const jsonStr = JSON.stringify(minified);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Error encoding product for URL:', err);
    return '';
  }
}

/**
 * Decodes a product from a compact URL-safe Base64 string
 */
export function decodeProductFromUrl(encoded) {
  if (!encoded || typeof encoded !== 'string') return null;
  try {
    let base64 = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr);
    if (parsed && (parsed.id || parsed.title)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Error decoding product from URL:', err);
    return null;
  }
}

/**
 * Builds a direct, marketing-ready product landing page link
 * Formatted for Facebook Ads, TikTok Ads, Instagram, and WhatsApp
 * Embeds the product payload so it opens seamlessly on ANY device in the world!
 */
export function getProductMarketingLink(productOrId, optionalProduct = null) {
  if (typeof window === 'undefined') return '';
  const product = typeof productOrId === 'object' ? productOrId : optionalProduct;
  const productId = typeof productOrId === 'string' ? productOrId : product?.id;
  if (!productId) return '';

  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const url = new URL(`${origin}${pathname}`);
    url.searchParams.set('p', productId);

    if (product) {
      const encoded = encodeProductForUrl(product);
      if (encoded && encoded.length < 1800) {
        url.searchParams.set('pd', encoded);
      }
    }

    return url.toString();
  } catch (e) {
    return `?p=${encodeURIComponent(productId)}`;
  }
}


