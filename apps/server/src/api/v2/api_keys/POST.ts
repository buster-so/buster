import { createApiKey, getUserOrganizationId } from '@buster/database/queries';
import type { CreateApiKeyResponse } from '@buster/server-shared/api';
import { CreateApiKeyRequestSchema } from '@buster/server-shared/api';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { sign } from 'jsonwebtoken';

const createExpiresAt = () => {
  return Math.floor(Date.now() / 1000) + 365 * 5 * 24 * 60 * 60; // 5 years from now
};

const app = new Hono().post('/', zValidator('json', CreateApiKeyRequestSchema), async (c) => {
  const user = c.get('busterUser');
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set');
    throw new HTTPException(500, { message: 'Server configuration error' });
  }

  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'User is not associated with an organization',
    });
  }

  // Create JWT claims (expires in 5 years, matching Rust implementation)
  const claims = {
    exp: createExpiresAt(),
    aud: 'api',
    sub: user.id,
  };

  // Generate JWT token
  const apiKey = sign(claims, jwtSecret, { algorithm: 'HS256' });

  // Store the API key in the database
  await createApiKey({
    ownerId: user.id,
    key: apiKey,
    organizationId: userOrg.organizationId,
  });

  const response: CreateApiKeyResponse = {
    api_key: apiKey,
  };

  return c.json(response);
});

export default app;
