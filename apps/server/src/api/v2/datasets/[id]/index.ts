import { Hono } from 'hono';
import { getDatasetRoute } from './GET';
import { sample } from './sample';

// Create Hono app for dataset by ID routes
export const datasetById = new Hono().route('/', getDatasetRoute).route('/sample', sample);
