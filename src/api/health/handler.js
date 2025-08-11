const { Pool } = require('pg');

class HealthHandler {
  constructor() {
    this._pool = new Pool();
  }

  async healthCheckHandler(request, h) {
    const startTime = Date.now();

    try {
      // Check database connection
      await this._pool.query('SELECT 1');

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        database: 'connected',
      };
    } catch (error) {
      const response = h.response({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        database: 'disconnected',
      });
      response.code(503);
      return response;
    }
  }
}

module.exports = HealthHandler;
