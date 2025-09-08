import { environment } from './environment';

// Production-ready logger that removes console logs in production
class Logger {
  private isDev = environment.isDevelopment;

  log(...args: any[]) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  warn(...args: any[]) {
    if (this.isDev) {
      console.warn(...args);
    }
  }

  error(...args: any[]) {
    // Always log errors, even in production
    console.error(...args);
  }

  debug(...args: any[]) {
    if (this.isDev) {
      console.log('[DEBUG]', ...args);
    }
  }
}

export const logger = new Logger();