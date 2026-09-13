/**
 * Cryptographic Admin Authentication & Anti-Brute-Force Security Suite
 * Zoom Market Dz Security Architecture
 */

const ADMIN_PIN_HASH_KEY = 'zoom_market_admin_pin_hash_v3';
const FAILED_ATTEMPTS_KEY = 'zoom_market_auth_failures_v3';
const LOCKOUT_EXPIRY_KEY = 'zoom_market_auth_lockout_until_v3';

// Salt for hash generation
const AUTH_SALT = 'ZOOM_MARKET_DZ_SECURE_SALT_2026_!@#';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Precomputed SHA-256 Hashes with AUTH_SALT:
// 'DZ2026': 1d4f696508f43db8d84a47d72d20c7d7b49c03c909c5a8983bd261fae76e7d64
// 'dz2026': 087d08192a6609a0c91be340c80631db5bb2286b63188df17a1db0f6eec42e71
// '2026DZ': 871aadb0bed5a128ffe174cb391c1bb9894187bed5e66f7cec1642db7d088010
// '2026dz': 92c4e81a8b061f8809a7722f369bbfcc01c33f4bdf483fab4e16d5964b552825
// Precomputed SHA-256 Hashes with AUTH_SALT:
// 'DZ2026': 1d4f696508f43db8d84a47d72d20c7d7b49c03c909c5a8983bd261fae76e7d64
// 'dz2026': 087d08192a6609a0c91be340c80631db5bb2286b63188df17a1db0f6eec42e71
// 'Dz2026': 66f39554cbd816c6f484e3a9beef735c732c59c41d0b2ad2d79cbe95432211be
// '2026DZ': 871aadb0bed5a128ffe174cb391c1bb9894187bed5e66f7cec1642db7d088010
// '2026dz': 92c4e81a8b061f8809a7722f369bbfcc01c33f4bdf483fab4e16d5964b552825
// '2026':   89e40f2b84d61835c41c577e443b13eaebeb678174e99e85b691511cc6d7303d
const DEFAULT_ALLOWED_HASHES = [
  '1d4f696508f43db8d84a47d72d20c7d7b49c03c909c5a8983bd261fae76e7d64', // DZ2026
  '087d08192a6609a0c91be340c80631db5bb2286b63188df17a1db0f6eec42e71', // dz2026
  '66f39554cbd816c6f484e3a9beef735c732c59c41d0b2ad2d79cbe95432211be', // Dz2026
  '871aadb0bed5a128ffe174cb391c1bb9894187bed5e66f7cec1642db7d088010', // 2026DZ
  '92c4e81a8b061f8809a7722f369bbfcc01c33f4bdf483fab4e16d5964b552825', // 2026dz
  '89e40f2b84d61835c41c577e443b13eaebeb678174e99e85b691511cc6d7303d'  // 2026
];

/**
 * Computes SHA-256 hash using Web Crypto API
 */
export async function hashPin(pin) {
  const salted = pin + AUTH_SALT;
  const encoder = new TextEncoder();
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks if authentication is currently locked due to too many failed attempts
 */
export function getLockoutStatus() {
  try {
    const lockoutUntil = localStorage.getItem(LOCKOUT_EXPIRY_KEY);
    if (lockoutUntil) {
      const remainingMs = parseInt(lockoutUntil, 10) - Date.now();
      if (remainingMs > 0) {
        return {
          isLocked: true,
          remainingSeconds: Math.ceil(remainingMs / 1000),
          remainingMinutes: Math.ceil(remainingMs / 60000)
        };
      } else {
        // Lockout expired, clean up
        localStorage.removeItem(LOCKOUT_EXPIRY_KEY);
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      }
    }

    const failedCount = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10);
    return {
      isLocked: false,
      failedAttempts: failedCount,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - failedCount)
    };
  } catch {
    return { isLocked: false, failedAttempts: 0, remainingAttempts: MAX_ATTEMPTS };
  }
}

/**
 * Record a failed authentication attempt
 */
export function recordFailedAttempt() {
  try {
    const current = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10) + 1;
    localStorage.setItem(FAILED_ATTEMPTS_KEY, current.toString());

    if (current >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_EXPIRY_KEY, lockoutUntil.toString());
      return { isLocked: true, remainingMinutes: 15 };
    }

    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - current };
  } catch {
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS };
  }
}

/**
 * Reset failed attempts upon successful login
 */
export function resetFailedAttempts() {
  try {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_EXPIRY_KEY);
  } catch (e) {
    console.error(e);
  }
}

/**
 * Cryptographic PIN Verification
 */
export async function verifyAdminPin(enteredPin) {
  // Check lockout first
  const lockout = getLockoutStatus();
  if (lockout.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingSeconds: lockout.remainingSeconds,
      remainingMinutes: lockout.remainingMinutes,
      message: `Accès temporairement bloqué pour des raisons de sécurité. Réessayez dans ${lockout.remainingMinutes} minutes.`
    };
  }

  const cleanPin = enteredPin.trim();
  const enteredHash = await hashPin(cleanPin);
  const upperHash = await hashPin(cleanPin.toUpperCase());
  
  // Custom saved PIN hash in localStorage if modified by the admin
  const storedCustomHash = localStorage.getItem(ADMIN_PIN_HASH_KEY);

  const isValid = (storedCustomHash && (enteredHash === storedCustomHash || upperHash === storedCustomHash))
    || DEFAULT_ALLOWED_HASHES.includes(enteredHash)
    || DEFAULT_ALLOWED_HASHES.includes(upperHash);

  if (isValid) {
    resetFailedAttempts();
    return { success: true };
  } else {
    const failStatus = recordFailedAttempt();
    if (failStatus.isLocked) {
      return {
        success: false,
        isLocked: true,
        remainingMinutes: 15,
        message: 'Trop de tentatives erronées. Accès bloqué pendant 15 minutes.'
      };
    }
    return {
      success: false,
      isLocked: false,
      remainingAttempts: failStatus.remainingAttempts,
      message: `Code PIN incorrect. (${failStatus.remainingAttempts} tentative(s) restante(s))`
    };
  }
}

/**
 * Securely change the admin PIN (stores SHA-256 hash)
 */
export async function changeAdminPin(newPin) {
  if (!newPin || newPin.trim().length < 4) {
    throw new Error('Le code PIN doit comporter au moins 4 caractères.');
  }
  const newHash = await hashPin(newPin.trim());
  localStorage.setItem(ADMIN_PIN_HASH_KEY, newHash);
  resetFailedAttempts();
}
