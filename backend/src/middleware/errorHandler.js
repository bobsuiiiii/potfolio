const logger = require('../config/logger');

module.exports = (err, req, res, _next) => {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  logger.error({ event: 'request_error', path: req.path, status, code: err.code, msg: err.message });
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    code: err.code || undefined,
  });
};
