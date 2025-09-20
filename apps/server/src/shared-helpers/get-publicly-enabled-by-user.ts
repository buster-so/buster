import { getUser } from '@buster/database/queries';

/**
 * Helper to get publicly enabled by user email
 */
export async function getPubliclyEnabledByUser(enabledById: string | null): Promise<string | null> {
  if (enabledById) {
    const publicEnabledByUser = await getUser({ id: enabledById });
    return publicEnabledByUser.email;
  }
  return null;
}
