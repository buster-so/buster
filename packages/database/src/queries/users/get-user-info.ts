import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { organizations, teams, teamsToUsers, users, usersToOrganizations } from '../../schema';
import {
  OrganizationColorPalettes,
  SharingSetting,
  TeamRole,
  UserAttributes,
  UserOrganizationRole,
} from '../../schema-types';

/**
 * Basic user information
 */
export interface BasicUserInfo {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  attributes: UserAttributes;
  avatarUrl: string | null;
}

/**
 * Organization with user's role
 */
export interface OrganizationWithRole {
  id: string;
  name: string;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  paymentRequired: boolean;
  domains: string[] | null;
  restrictNewUserInvitations: boolean;
  defaultRole: UserOrganizationRole;
  organizationColorPalettes: OrganizationColorPalettes;
  role: UserOrganizationRole;
}

/**
 * Team with user's role
 */
export interface TeamWithRole {
  id: string;
  name: string;
  organizationId: string;
  sharingSetting: SharingSetting;
  editSql: boolean;
  uploadCsv: boolean;
  exportAssets: boolean;
  emailSlackEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  role: TeamRole;
}

/**
 * User information response including organizations and teams
 */
export interface UserInfoResponse {
  user: BasicUserInfo;
  organizations: OrganizationWithRole[];
  teams: TeamWithRole[];
}

/**
 * Get basic user information from the users table
 */
export async function getBasicUserInfo(userId: string): Promise<BasicUserInfo> {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      attributes: users.attributes,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = result[0];

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    attributes: user.attributes as UserAttributes,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Get all organizations the user is a member of with their roles
 */
export async function getUserOrgs(userId: string): Promise<OrganizationWithRole[]> {
  const results = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      domain: organizations.domain,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
      deletedAt: organizations.deletedAt,
      paymentRequired: organizations.paymentRequired,
      domains: organizations.domains,
      restrictNewUserInvitations: organizations.restrictNewUserInvitations,
      defaultRole: organizations.defaultRole,
      organizationColorPalettes: organizations.organizationColorPalettes,
      role: usersToOrganizations.role,
    })
    .from(usersToOrganizations)
    .innerJoin(
      organizations,
      and(
        eq(usersToOrganizations.organizationId, organizations.id),
        isNull(organizations.deletedAt)
      )
    )
    .where(and(eq(usersToOrganizations.userId, userId), isNull(usersToOrganizations.deletedAt)));

  return results;
}

/**
 * Get all teams the user is a member of with their roles
 */
export async function getUserTeamsInfo(userId: string): Promise<TeamWithRole[]> {
  const results = await db
    .select({
      id: teams.id,
      name: teams.name,
      organizationId: teams.organizationId,
      sharingSetting: teams.sharingSetting,
      editSql: teams.editSql,
      uploadCsv: teams.uploadCsv,
      exportAssets: teams.exportAssets,
      emailSlackEnabled: teams.emailSlackEnabled,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
      deletedAt: teams.deletedAt,
      role: teamsToUsers.role,
    })
    .from(teamsToUsers)
    .innerJoin(teams, and(eq(teamsToUsers.teamId, teams.id), isNull(teams.deletedAt)))
    .where(and(eq(teamsToUsers.userId, userId), isNull(teamsToUsers.deletedAt)));

  return results;
}
