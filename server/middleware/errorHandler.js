// Express global error middleware. Catches any error thrown synchronously
// or passed to next(err) from a route, logs it with request context, and
// returns a clean JSON response.
//
// Mount LAST in server/index.js (after all routes).
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  // Server errors are interesting; client errors usually aren't.
  if (status >= 500) {
    logger.error('Unhandled route error', err, {
      method: req.method,
      path: req.originalUrl,
      userId: req.user?.id || null,
      ip: req.ip,
    });
  }
  if (res.headersSent) {
    // Express docs: if headers already sent, delegate to default handler
    // so the connection closes. Returning here would hang the request.
    return _next(err);
  }
  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : (err.message || 'Error'),
  });
}

module.exports = errorHandler;
