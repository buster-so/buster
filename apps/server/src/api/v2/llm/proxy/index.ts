import { Hono } from 'hono';
import { POST } from './POST';

export const proxy = new Hono().route('/', POST);
