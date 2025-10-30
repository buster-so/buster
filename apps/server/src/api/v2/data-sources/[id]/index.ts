import { Hono } from 'hono';
import { deleteDataSourceRoute } from './DELETE';
import { getDataSourceRoute } from './GET';
import { updateDataSourceRoute } from './PUT';

export const dataSourceById = new Hono()
  .route('/', getDataSourceRoute)
  .route('/', updateDataSourceRoute)
  .route('/', deleteDataSourceRoute);
