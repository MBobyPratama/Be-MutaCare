import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import docsRoutes from './docsRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import moodRoutes from './moodRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import simulationRoutes from './simulationRoutes.js';

const apiRouter = Router();

// Health Check Endpoint
apiRouter.use(healthRoutes);

// Scalar API Reference Documentation Endpoint (/api/v1/docs)
apiRouter.use('/docs', docsRoutes);

// Authentication Endpoints
apiRouter.use('/auth', authRoutes);

// User Profile Endpoints
apiRouter.use('/users', userRoutes);

// Assessment & Therapy Plan Endpoints
apiRouter.use('/assessments', assessmentRoutes);

// Daily Mood & Therapy Dashboard Endpoints
apiRouter.use('/moods', moodRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

// Virtual Exposure Simulation Endpoints
apiRouter.use('/simulations', simulationRoutes);

// Placeholder domain route groups (to be implemented per domain spec)
// apiRouter.use('/journey', journeyRoutes);
// apiRouter.use('/reflections', reflectionRoutes);
// apiRouter.use('/progress', progressRoutes);

export default apiRouter;
