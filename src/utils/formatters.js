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
 * Formats a phone number nicely for display (e.g. 0550 12 34 56)
 */
export function formatDZPhoneDisplay(phone) {
  const clean = normalizeDZPhone(phone);
  if (!clean || clean.length !== 10) return phone;
  return `${clean.slice(0, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
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
 * Builds a direct, marketing-ready product landing page link
 * Formatted for Facebook Ads, TikTok Ads, Instagram, and WhatsApp
 */
export function getProductMarketingLink(productId) {
  if (typeof window === 'undefined' || !productId) return '';
  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?p=${encodeURIComponent(productId)}`;
  } catch (e) {
    return `?p=${encodeURIComponent(productId)}`;
  }
}

