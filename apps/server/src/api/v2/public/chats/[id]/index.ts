import { Hono } from 'hono';
import { messages } from './messages';

export const chatById = new Hono().route('/messages', messages);
