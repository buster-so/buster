import { Hono } from 'hono';
import GET from './GET';
import { messageById } from './[messageId]';

export const messages = new Hono().route('/', GET).route('/:messageId', messageById);
