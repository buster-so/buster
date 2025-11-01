import { listUserFavorites } from '@buster/database/queries';
import type { UserFavoriteResponse } from '@buster/server-shared/user';
import { Hono } from 'hono';

const app = new Hono().get('/', async (c) => {
  const { id: userId } = c.get('busterUser');

  try {
    const favorites: UserFavoriteResponse = await getUserFavorites(userId);
    return c.json(favorites);
  } catch (error) {
    console.error('Error listing favorites:', error);
    return c.json({ message: 'Error listing favorites' }, 500);
  }
});

export default app;

export async function getUserFavorites(userId: string): Promise<UserFavoriteResponse> {
  return await listUserFavorites(userId);
}
