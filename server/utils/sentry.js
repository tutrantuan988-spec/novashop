/**
 * Sentry server-side init (P11).
 *
 * Activate khi có SENTRY_DSN. Sample 10% traces để tiết kiệm quota.
 */

let initialized = false;
let Sentry = null;

function initSentry() {
  if (initialized) return Sentry;
  initialized = true;
  if (!process.env.SENTRY_DSN || process.env.SENTRY_DSN === 'your_key_here') {
    console.log('[Sentry] SENTRY_DSN không cấu hình — disabled');
    return null;
  }
  try {
    // eslint-disable-next-line global-require
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1
    });
    console.log('[Sentry] Initialized');
    return Sentry;
  } catch (err) {
    console.warn('[Sentry] init failed:', err.message);
    Sentry = null;
    return null;
  }
}

function captureException(err, context) {
  const s = initSentry();
  if (!s) return;
  try {
    if (context) s.setContext('payload', context);
    s.captureException(err);
  } catch {}
}

function captureMessage(message, level = 'info') {
  const s = initSentry();
  if (!s) return;
  try {
    s.captureMessage(message, level);
  } catch {}
}

function expressErrorHandler() {
  const s = initSentry();
  if (!s) return (err, _req, _res, next) => next(err);
  return s.Handlers.errorHandler();
}

function expressRequestHandler() {
  const s = initSentry();
  if (!s) return (_req, _res, next) => next();
  return s.Handlers.requestHandler();
}

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  expressErrorHandler,
  expressRequestHandler
};
