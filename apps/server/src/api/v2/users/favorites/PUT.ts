import { updateUserFavorites } from '@buster/database/queries';
import {
  type UserFavoriteResponse,
  UserUpdateFavoriteRequestSchema,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { getUserFavorites } from './GET';

const app = new Hono().put('/', zValidator('json', UserUpdateFavoriteRequestSchema), async (c) => {
  const { id: userId } = c.get('busterUser');
  const orderedAssetIds = c.req.valid('json');

  try {
    await updateUserFavorites(userId, orderedAssetIds);
    const favorites: UserFavoriteResponse = await getUserFavorites(userId);
    return c.json(favorites);
  } catch (error) {
    console.error('Error updating favorites:', error);
    return c.json({ message: 'Error updating favorites' }, 500);
  }
});

export default app;
