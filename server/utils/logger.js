// Structured stdout logger. Renders one-line, ISO-timestamped entries that
// are easy to scan in Render's log viewer. Errors include stack + optional
// request context (method, path, user, duration, etc.).
//
// Usage:
//   logger.info('Server started', { port: 5000 });
//   logger.warn('Cache miss', { key });
//   logger.error('Something blew up', err, { path: req.path });
function formatLine(level, message, extra) {
  const ts = new Date().toISOString();
  let line = `${ts} [${level}] ${message}`;
  if (extra && Object.keys(extra).length) {
    try {
      line += ' ' + JSON.stringify(extra);
    } catch {
      line += ' [extra not serializable]';
    }
  }
  return line;
}

function serializeError(err) {
  if (!err) return null;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { value: String(err) };
}

module.exports = {
  info(message, extra) {
    console.log(formatLine('INFO', message, extra));
  },
  warn(message, extra) {
    console.warn(formatLine('WARN', message, extra));
  },
  error(message, err, extra = {}) {
    const payload = { ...extra };
    const serialized = serializeError(err);
    if (serialized) payload.error = serialized;
    console.error(formatLine('ERROR', message, payload));
  },
};
