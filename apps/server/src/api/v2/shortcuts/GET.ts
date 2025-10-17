import { db, eq } from '@buster/database/connection';
import { getUserOrganizationId, getUserShortcuts, type User } from '@buster/database/queries';
import { users } from '@buster/database/schema';
import type { ListShortcutsResponse } from '@buster/server-shared/shortcuts';
import { HTTPException } from 'hono/http-exception';

export async function listShortcutsHandler(user: User): Promise<ListShortcutsResponse> {
  try {
    // Get user's organization ID
    const userOrg = await getUserOrganizationId(user.id);

    if (!userOrg) {
      throw new HTTPException(400, {
        message: 'User must belong to an organization',
      });
    }

    const { organizationId } = userOrg;

    // Get user's lastUsedShortcuts array
    const [userRecord] = await db
      .select({ lastUsedShortcuts: users.lastUsedShortcuts })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const lastUsedShortcutIds = userRecord?.lastUsedShortcuts || [];

    // Get all accessible shortcuts (personal + workspace)
    const shortcuts = await getUserShortcuts({
      userId: user.id,
      organizationId,
    });

    // Sort shortcuts by last used order
    const sortedShortcuts = shortcuts.sort((a, b) => {
      const aIndex = lastUsedShortcutIds.indexOf(a.id);
      const bIndex = lastUsedShortcutIds.indexOf(b.id);

      // If both are in lastUsed, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only a is in lastUsed, it comes first
      if (aIndex !== -1) {
        return -1;
      }

      // If only b is in lastUsed, it comes first
      if (bIndex !== -1) {
        return 1;
      }

      // Neither is in lastUsed, sort alphabetically
      return a.name.localeCompare(b.name);
    });

    return {
      shortcuts: sortedShortcuts,
    };
  } catch (error) {
    console.error('Error in listShortcutsHandler:', {
      userId: user.id,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: 'Failed to fetch shortcuts',
    });
  }
}
