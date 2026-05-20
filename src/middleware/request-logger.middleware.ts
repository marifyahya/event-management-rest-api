import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../libs/logger.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existingId = req.headers['x-request-id'];
    const requestId = Array.isArray(existingId) ? existingId[0] : existingId || randomUUID();

    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) {
      return 'error';
    }

    if (res.statusCode >= 400) {
      return 'warn';
    }

    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} failed with ${res.statusCode}`;
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
