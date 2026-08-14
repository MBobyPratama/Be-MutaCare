import { Router, Request, Response, NextFunction } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { openApiSpec } from '../docs/openapiSpec.js';

const router = Router();

/**
 * Middleware to clear restrictive CSP headers specifically for documentation route
 */
const allowDocsAssets = (_req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
};

/**
 * Scalar API Reference Documentation Route
 * Accessible at GET /api/v1/docs
 */
router.use(
  '/',
  allowDocsAssets,
  apiReference({
    spec: {
      content: openApiSpec,
    },
    theme: 'purple',
  })
);

export default router;
