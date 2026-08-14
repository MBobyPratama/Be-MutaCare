import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import moodRoutes from './moodRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const apiRouter = Router();

// Health Check Endpoint
apiRouter.use(healthRoutes);

// Assessment & Therapy Plan Endpoints
apiRouter.use('/assessments', assessmentRoutes);

// Daily Mood & Therapy Dashboard Endpoints
apiRouter.use('/moods', moodRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

// Placeholder domain route groups (to be implemented per domain spec)
// apiRouter.use('/users', userRoutes);
// apiRouter.use('/journey', journeyRoutes);
// apiRouter.use('/simulations', simulationRoutes);
// apiRouter.use('/reflections', reflectionRoutes);
// apiRouter.use('/progress', progressRoutes);

export default apiRouter;
