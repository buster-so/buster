import { Hono } from 'hono';
import automationApp from './automation';
import projectApp from './project';

const app = new Hono()
  .route('/project', projectApp)
  .route('/automation', automationApp);

export default app;
