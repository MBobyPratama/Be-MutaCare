import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';

const apiRouter = Router();

// Health Check Endpoint
apiRouter.use(healthRoutes);

// Assessment & Therapy Plan Endpoints
apiRouter.use('/assessments', assessmentRoutes);

// Placeholder domain route groups (to be implemented per domain spec)
// apiRouter.use('/users', userRoutes);
// apiRouter.use('/moods', moodRoutes);
// apiRouter.use('/dashboard', dashboardRoutes);
// apiRouter.use('/journey', journeyRoutes);
// apiRouter.use('/simulations', simulationRoutes);
// apiRouter.use('/reflections', reflectionRoutes);
// apiRouter.use('/progress', progressRoutes);

export default apiRouter;
