const logger = require('../utils/logger');

const requestLogger = (request, h) => {
  const start = Date.now();

  request.events.once('response', () => {
    const duration = Date.now() - start;
    const { method, path, query } = request;
    const { statusCode } = request.response;
    const userAgent = request.headers['user-agent'];
    const ip = request.info.remoteAddress;

    logger.info('HTTP Request', {
      method,
      path,
      query,
      statusCode,
      duration: `${duration}ms`,
      userAgent,
      ip,
      userId: request.auth?.credentials?.id || 'anonymous',
    });
  });

  return h.continue;
};

module.exports = requestLogger;
