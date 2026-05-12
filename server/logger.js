/**
 * Simple request logging middleware.
 * Logs method, path, status, duration, and optionally IP & user agent.
 */
function requestLogger(req, res, next) {
  // Skip logging for static assets and docs
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
    return next();
  }
  if (req.path === '/api/docs' || req.path.startsWith('/api/docs/')) {
    return next();
  }

  const start = process.hrtime.bigint();
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;

  const log = () => {
    const duration = Number(process.hrtime.bigint() - start) / 1_000_000; // ms
    const status = res.statusCode;
    const statusColor =
      status >= 500 ? '\x1b[31m' : // red
      status >= 400 ? '\x1b[33m' : // yellow
      status >= 300 ? '\x1b[36m' : // cyan
      '\x1b[32m';                  // green
    const reset = '\x1b[0m';

    const method = req.method.padEnd(6, ' ');
    const path = req.originalUrl;
    const size = res.getHeader('content-length') || '-';

    console.log(
      `[${new Date().toISOString()}] ${method} ${path} ${statusColor}${status}${reset} ${duration.toFixed(2)}ms ${size}b ${ip || '-'}`
    );
  };

  res.on('finish', log);
  res.on('close', log);
  next();
}

module.exports = { requestLogger };
