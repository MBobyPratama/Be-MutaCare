type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

class Logger {
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  info(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage('INFO', message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('ERROR', message), ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }
}

export const logger = new Logger();
