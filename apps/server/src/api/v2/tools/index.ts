import { Hono } from 'hono';
import metadata from './metadata';
import sql from './sql';

export const tools = new Hono().route('/sql', sql).route('/metadata', metadata);
