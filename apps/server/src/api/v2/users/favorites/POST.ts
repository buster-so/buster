import { createUserFavorites } from '@buster/database/queries';
import {
  UserCreateFavoriteRequestSchema,
  type UserFavoriteResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { getUserFavorites } from './GET';

const app = new Hono().post(
  '/',
  zValidator('json', z.array(UserCreateFavoriteRequestSchema)),
  async (c) => {
    const { id: userId } = c.get('busterUser');
    const payload = c.req.valid('json');

    try {
      await createUserFavorites(userId, payload);
      const favorites: UserFavoriteResponse = await getUserFavorites(userId);
      return c.json(favorites);
    } catch (error) {
      console.error('Error creating favorites:', error);
      return c.json({ message: 'Error creating favorites' }, 500);
    }
  }
);

export default app;
