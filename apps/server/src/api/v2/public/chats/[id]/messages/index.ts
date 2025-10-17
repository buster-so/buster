import { Hono } from 'hono';
import { messageById } from './[messageId]';
import GET from './GET';

export const messages = new Hono().route('/', GET).route('/:messageId', messageById);
