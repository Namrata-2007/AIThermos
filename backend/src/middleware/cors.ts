import { Request, Response, NextFunction } from 'express';

export function configureCors(req: Request, res: Response, next: NextFunction) {
  const allowedOriginEnv = process.env.FRONTEND_URL?.trim();
  const requestOrigin = req.headers.origin;

  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    /\.vercel\.app$/,
    /\.onrender\.com$/,
    /\.run\.app$/
  ];

  if (allowedOriginEnv) {
    allowedOrigins.push(allowedOriginEnv.replace(/\/+$/, ''));
  }

  let originToSet = allowedOriginEnv || '*';
  if (requestOrigin) {
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === requestOrigin || allowed === '*';
      }
      return allowed.test(requestOrigin);
    });

    if (isAllowed) {
      originToSet = requestOrigin;
    }
  }

  res.header('Access-Control-Allow-Origin', originToSet);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}
