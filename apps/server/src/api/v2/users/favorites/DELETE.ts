import { deleteUserFavorites } from '@buster/database/queries';
import {
  UserDeleteFavoriteRequestSchema,
  type UserFavoriteResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { getUserFavorites } from './GET';

const app = new Hono().delete(
  '/',
  zValidator('json', UserDeleteFavoriteRequestSchema),
  async (c) => {
    const { id: userId } = c.get('busterUser');
    const assetIds = c.req.valid('json');

    try {
      await deleteUserFavorites(userId, assetIds);
      const favorites: UserFavoriteResponse = await getUserFavorites(userId);
      return c.json(favorites);
    } catch (error) {
      console.error('Error deleting favorites:', error);
      return c.json({ message: 'Error deleting favorites' }, 500);
    }
  }
);

export default app;
