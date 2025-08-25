import type { User } from '@buster/database';
import {
  type CreateS3IntegrationRequest,
  CreateS3IntegrationRequestSchema,
  type CreateS3IntegrationResponse,
} from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { createS3IntegrationHandler } from './create-s3-integration';

const app = new Hono();

export const createS3IntegrationRoute = app.post(
  '/',
  zValidator('json', CreateS3IntegrationRequestSchema),
  async (c) => {
    const user = c.get('busterUser') as User;
    const request = c.req.valid('json') as CreateS3IntegrationRequest;

    const response = await createS3IntegrationHandler(user, request);
    return c.json(response as CreateS3IntegrationResponse, 201);
  }
);

export default app;
