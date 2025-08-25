import { Hono } from 'hono';
import { requireAuth } from '../../../middleware/auth';
import { deleteS3IntegrationRoute } from './DELETE';
import { getS3IntegrationRoute } from './GET';
import { createS3IntegrationRoute } from './POST';

const app = new Hono();

// Apply authentication to all routes
app.use('*', requireAuth);

// Mount routes
app.route('/', createS3IntegrationRoute);
app.route('/', deleteS3IntegrationRoute);
app.route('/', getS3IntegrationRoute);

export default app;
