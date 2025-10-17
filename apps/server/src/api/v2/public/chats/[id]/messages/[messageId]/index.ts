import { Hono } from 'hono';
import POST from './POST';
import PUT from './PUT';

export const messageById = new Hono().route('/', POST).route('/', PUT);
