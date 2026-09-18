export const logger = {
  info: (msg: string, ...args: any[]) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, ...args);
  },
  debug: (msg: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${msg}`, ...args);
    }
  }
};
