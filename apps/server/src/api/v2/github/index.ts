import { Hono } from 'hono';
import APP from './app';
import CheckRun from './check-run';

const app = new Hono().route('/app', APP).route('/check-run', CheckRun);

export default app;
