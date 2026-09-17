/**
 * Zoom Market Dz - Zero-Database Direct Frontend Synchronization
 * 
 * Synchronizes catalog state (hidden products, stock toggles, prices, special offer)
 * directly between Laptop and Smartphone WITHOUT any external database:
 * - QR Code instant scan
 * - WhatsApp / One-click link share (?sync_state=...)
 * - Export to initialProducts.js for permanent GitHub Pages deployment
 */

import { saveProducts, saveSpecialOffer, getStoredProducts, getStoredSpecialOffer } from './storage.js';

/**
 * Encodes catalog state into a compact, URL-safe base64 string
 */
export function encodeCatalogState(products, specialOffer) {
  try {
    const hiddenIds = (products || [])
      .filter((p) => p.isVisible === false)
      .map((p) => p.id);

    const outOfStockIds = (products || [])
      .filter((p) => p.inStock === false || p.stockQuantity === 0 || p.badge === 'Rupture de Stock' || p.badge === 'نفذت الكمية')
      .map((p) => p.id);

    const customPrices = {};
    (products || []).forEach((p) => {
      if (p.price) {
        customPrices[p.id] = { price: p.price, oldPrice: p.oldPrice };
      }
    });

    const payload = {
      v: 2,
      ts: Date.now(),
      hidden: hiddenIds,
      out: outOfStockIds,
      prices: customPrices,
      so: specialOffer ? {
        enabled: specialOffer.enabled,
        tagline: specialOffer.tagline,
        title: specialOffer.title,
        price: specialOffer.price,
        oldPrice: specialOffer.oldPrice,
        description: specialOffer.description
      } : null,
      // Full products if count is reasonable
      full: (products || []).map((p) => ({
        id: p.id,
        title: p.title,
        titleAr: p.titleAr,
        price: p.price,
        oldPrice: p.oldPrice,
        category: p.category,
        badge: p.badge,
        inStock: p.inStock !== false,
        stockQuantity: p.stockQuantity ?? 10,
        isVisible: p.isVisible !== false,
        description: p.description,
        descriptionAr: p.descriptionAr,
        image: p.image,
        images: p.images || [],
        sizes: p.sizes || [],
        colors: p.colors || [],
        colorImageMap: p.colorImageMap || {}
      }))
    };

    const jsonStr = JSON.stringify(payload);
    // URL-safe base64 encoding
    if (typeof window !== 'undefined' && window.btoa) {
      return btoa(unescape(encodeURIComponent(jsonStr)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
    return Buffer.from(jsonStr).toString('base64url');
  } catch (err) {
    console.error('Error encoding catalog state:', err);
    return '';
  }
}

/**
 * Decodes catalog state from URL-safe base64 string
 */
export function decodeCatalogState(encodedStr) {
  try {
    if (!encodedStr || typeof encodedStr !== 'string') return null;
    let base64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    let jsonStr = '';
    if (typeof window !== 'undefined' && window.atob) {
      jsonStr = decodeURIComponent(escape(atob(base64)));
    } else {
      jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    }

    const payload = JSON.parse(jsonStr);
    return payload;
  } catch (err) {
    console.error('Error decoding catalog state:', err);
    return null;
  }
}

/**
 * Applies decoded state to local products and special offer
 */
export function applyCatalogState(payload, currentProducts, currentSpecialOffer) {
  if (!payload) return null;

  let updatedProducts = [...(currentProducts || [])];

  // 1. If full products array is available, use it directly
  if (Array.isArray(payload.full) && payload.full.length > 0) {
    updatedProducts = payload.full;
  } else {
    // Otherwise apply delta overrides (hidden, out of stock, prices)
    const hiddenSet = new Set(payload.hidden || []);
    const outSet = new Set(payload.out || []);
    const prices = payload.prices || {};

    updatedProducts = updatedProducts.map((p) => {
      const isHidden = hiddenSet.has(p.id);
      const isOut = outSet.has(p.id);
      const priceData = prices[p.id];

      return {
        ...p,
        isVisible: !isHidden,
        inStock: !isOut,
        badge: isOut ? 'Rupture de Stock' : p.badge,
        price: priceData?.price !== undefined ? priceData.price : p.price,
        oldPrice: priceData?.oldPrice !== undefined ? priceData.oldPrice : p.oldPrice
      };
    });
  }

  // 2. Apply Special Offer if provided
  let updatedOffer = currentSpecialOffer;
  if (payload.so && typeof payload.so === 'object') {
    updatedOffer = {
      ...(currentSpecialOffer || {}),
      ...payload.so
    };
  }

  // 3. Save to localStorage
  saveProducts(updatedProducts, false);
  if (updatedOffer) {
    saveSpecialOffer(updatedOffer, false);
  }

  return {
    products: updatedProducts,
    specialOffer: updatedOffer
  };
}

/**
 * Generates direct smartphone pairing link and QR code image URL
 */
export function generateDirectSyncLink(products, specialOffer) {
  if (typeof window === 'undefined') return { url: '', qrUrl: '' };

  const encoded = encodeCatalogState(products, specialOffer);
  if (!encoded) return { url: '', qrUrl: '' };

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('sync_db');
  currentUrl.searchParams.delete('sync_auth');
  currentUrl.searchParams.set('sync_state', encoded);

  const finalUrl = currentUrl.toString();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(finalUrl)}`;

  return {
    url: finalUrl,
    qrUrl,
    encoded
  };
}

/**
 * Generates JavaScript code representing initialProducts.js
 */
export function generateInitialProductsCode(products) {
  const cleanList = (products || []).map((p) => {
    const item = {
      id: p.id,
      title: p.title || '',
      price: Number(p.price) || 0,
      oldPrice: Number(p.oldPrice) || 0,
      category: p.category || 'High-Tech',
      badge: p.badge || 'Nouveau',
      description: p.description || '',
      image: p.image || (p.images && p.images[0]) || '',
      images: p.images || [],
      colors: p.colors || [],
      colorImageMap: p.colorImageMap || {},
      sizes: p.sizes || [],
      inStock: p.inStock !== false,
      stockQuantity: p.stockQuantity ?? 10,
      isVisible: p.isVisible !== false,
      rating: p.rating || 4.8,
      reviewsCount: p.reviewsCount || 20
    };
    if (p.titleAr) item.titleAr = p.titleAr;
    if (p.descriptionAr) item.descriptionAr = p.descriptionAr;
    return item;
  });

  return `export const INITIAL_PRODUCTS = ${JSON.stringify(cleanList, null, 2)};\n`;
}

/**
 * Triggers a browser download of the updated initialProducts.js file
 */
export function downloadInitialProductsJs(products) {
  if (typeof window === 'undefined') return;
  const code = generateInitialProductsCode(products);
  const blob = new Blob([code], { type: 'text/javascript;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'initialProducts.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
