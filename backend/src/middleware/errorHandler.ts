import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.ts';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(`Unhandled request error on ${req.method} ${req.url}:`, err.stack || err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
}
