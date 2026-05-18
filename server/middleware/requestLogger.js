// Request logger that only emits on 5xx responses. Keeps the log volume
// low while still surfacing server errors that bypassed the error
// middleware (e.g. a route that responded with res.status(500).json(...)
// directly instead of throwing).
//
// Mount EARLY in server/index.js — before routes, after cors/session.
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} -> ${res.statusCode}`, null, {
        durationMs: Date.now() - start,
        userId: req.user?.id || null,
        ip: req.ip,
      });
    }
  });
  next();
}

module.exports = requestLogger;
