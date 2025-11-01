import { getBasicUserInfo, getUserOrgs, getUserTeamsInfo } from '@buster/database/queries';
import type { UserResponse } from '@buster/server-shared/user';
import { Hono } from 'hono';

const app = new Hono().get('/', async (c) => {
  const { id: userId } = c.get('busterUser');

  try {
    const response: UserResponse = await getAuthenticatedUserHandler(userId);
    return c.json(response);
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Error fetching user information' }, 500);
  }
});

export default app;

async function getAuthenticatedUserHandler(userId: string): Promise<UserResponse> {
  const [userDetails, organizations, teams] = await Promise.all([
    getBasicUserInfo(userId),
    getUserOrgs(userId),
    getUserTeamsInfo(userId),
  ]);

  return {
    user: {
      id: userDetails.id,
      email: userDetails.email,
      name: userDetails.name ?? userDetails.email,
      created_at: userDetails.createdAt,
      updated_at: userDetails.updatedAt,
      attributes: userDetails.attributes,
      avatar_url: userDetails.avatarUrl,
      favorites: [],
    },
    organizations,
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      organization_id: team.organizationId,
      sharing_settings: team.sharingSetting,
      edit_sql: team.editSql,
      upload_csv: team.uploadCsv,
      export_assets: team.exportAssets,
      email_slack_enabled: team.emailSlackEnabled,
      created_at: team.createdAt,
      updated_at: team.updatedAt,
      deleted_at: team.deletedAt,
      role: team.role,
    })),
  };
}
