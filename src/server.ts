import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 MutaCare Backend API server started successfully!`);
  logger.info(`🌐 Listening on port: ${PORT}`);
  logger.info(`🔧 Environment: ${env.NODE_ENV}`);
  logger.info(`📡 Base URL: http://localhost:${PORT}/api/v1`);
});

// Graceful Shutdown Handler
const handleGracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});
