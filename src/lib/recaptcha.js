/**
 * Google reCAPTCHA v3 - Bảo vệ form khỏi spam
 *
 * Cấu hình:
 *   VITE_RECAPTCHA_SITE_KEY=<site_key> trong .env.local
 *
 * Cách dùng:
 *   import { executeRecaptcha, isRecaptchaConfigured } from '../lib/recaptcha';
 *
 *   // Trong form submit handler:
 *   const token = await executeRecaptcha('contact_form');
 *   fetch('/api/contact', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ ...formData, recaptchaToken: token })
 *   });
 */

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const SCRIPT_ID = 'recaptcha-script';
let loaded = false;
let loadingPromise = null;

/**
 * Kiểm tra reCAPTCHA đã được cấu hình chưa
 */
export function isRecaptchaConfigured() {
  return !!(SITE_KEY && SITE_KEY.length > 10);
}

/**
 * Load reCAPTCHA script dynamically (lazy load)
 */
function loadRecaptchaScript() {
  if (loaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    // Nếu đã có global grecaptcha thì skip
    if (window.grecaptcha && window.grecaptcha.ready) {
      loaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      loaded = true;
      resolve();
    };
    script.onerror = () => {
      console.warn('[reCAPTCHA] Failed to load script');
      reject(new Error('Failed to load reCAPTCHA'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Execute reCAPTCHA v3 và trả về token
 *
 * @param {string} action - Tên action (vd: 'contact_form', 'login', 'register')
 * @returns {Promise<string>} recaptcha token
 */
export async function executeRecaptcha(action = 'generic_form') {
  if (!isRecaptchaConfigured()) {
    console.warn('[reCAPTCHA] Not configured — set VITE_RECAPTCHA_SITE_KEY');
    return '';
  }

  try {
    await loadRecaptchaScript();

    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error('reCAPTCHA not available'));
        return;
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(SITE_KEY, { action })
          .then((token) => resolve(token))
          .catch((err) => {
            console.warn('[reCAPTCHA] Execute error:', err);
            resolve(''); // Fail open — không block user
          });
      });
    });
  } catch (error) {
    console.warn('[reCAPTCHA] Error:', error);
    return '';
  }
}

export default {
  isRecaptchaConfigured,
  executeRecaptcha
};
