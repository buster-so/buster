import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '../../connection';
import { githubIntegrationRequests } from '../../schema';

/**
 * Get active GitHub integration request by organization ID
 */
export async function getGithubIntegrationRequestByOrganizationId(organizationId: string) {
  const [request] = await db
    .select()
    .from(githubIntegrationRequests)
    .where(
      and(
        eq(githubIntegrationRequests.organizationId, organizationId),
        isNull(githubIntegrationRequests.deletedAt)
      )
    )
    .limit(1);

  return request;
}

/**
 * Get active GitHub integration request by GitHub login
 */
export async function getGithubIntegrationRequestByOrgMemberList(orgMembers: string[]) {
  const requests = await db
    .select()
    .from(githubIntegrationRequests)
    .where(
      and(
        inArray(githubIntegrationRequests.githubLogin, orgMembers),
        isNull(githubIntegrationRequests.deletedAt)
      )
    );

  if (requests.length === 0 || !requests[0]) {
    return null;
  }
  if (requests.length > 1) {
    console.error(`Multiple pending requests found that could match an installation`);
    return null;
  }

  return requests[0];
}

/**
 * Get all active GitHub integration requests
 */
export async function getAllGithubIntegrationRequests() {
  const requests = await db
    .select()
    .from(githubIntegrationRequests)
    .where(isNull(githubIntegrationRequests.deletedAt));

  return requests;
}
