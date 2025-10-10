import { Hono } from 'hono';
import { proxy } from './proxy';

export const llm = new Hono().route('/proxy', proxy);
