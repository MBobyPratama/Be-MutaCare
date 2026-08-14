import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { logger } from './utils/logger.js';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple HTTP Request Logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`HTTP ${req.method} ${req.url}`);
  next();
});

// API Routes V1
app.use('/api/v1', apiRouter);

// 404 Route Not Found Middleware
app.use(notFoundHandler);

// Global Central Error Handler Middleware (Must be registered last)
app.use(errorHandler);

export default app;
