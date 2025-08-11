const rateLimitMap = new Map();

const rateLimit = (options = {}) => {
  const maxRequests = options.max || parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;
  const windowMs = options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900000;

  return (request, h) => {
    const clientId = request.info.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(clientId)) {
      rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
      return h.continue;
    }

    const clientData = rateLimitMap.get(clientId);

    if (now > clientData.resetTime) {
      rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
      return h.continue;
    }

    if (clientData.count >= maxRequests) {
      const response = h.response({
        status: 'fail',
        message: 'Too many requests, please try again later.',
      });
      response.code(429);
      return response.takeover();
    }

    clientData.count += 1;
    return h.continue;
  };
};

module.exports = rateLimit;
