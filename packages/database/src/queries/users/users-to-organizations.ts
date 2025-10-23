import {
  and,
  asc,
  count,
  eq,
  type InferSelectModel,
  inArray,
  isNull,
  like,
  not,
  or,
} from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import {
  userOrganizationRoleEnum,
  userOrganizationStatusEnum,
  users,
  usersToOrganizations,
} from '../../schema';
import {
  createPaginatedResponse,
  type PaginatedResponse,
  UserOrganizationRoleSchema,
  UserOrganizationStatusSchema,
  withPagination,
} from '../../schema-types';
import { getUserOrganizationId } from '../organizations/organizations';

// Type-safe schema types
type User = InferSelectModel<typeof users>;
type UserToOrganization = InferSelectModel<typeof usersToOrganizations>;

// Input validation schema
const GetUserToOrganizationInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  page: z.number().optional().default(1),
  page_size: z.number().optional().default(250),
  user_name: z.string().optional(),
  email: z.string().optional(),
  query: z.string().optional(),
  role: z.array(UserOrganizationRoleSchema).optional(),
  status: z.array(UserOrganizationStatusSchema).optional(),
  force_include_in_search: z.array(z.string()).optional(),
});

type GetUserToOrganizationInput = z.infer<typeof GetUserToOrganizationInputSchema>;

// Type-safe organization user type using Pick
type OrganizationUser = Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'> &
  Pick<UserToOrganization, 'role' | 'status'>;

/**
 * Get paginated list of users in the same organization as the requesting user
 * with optional filtering by name or email
 */
export const getUserToOrganization = async (
  params: GetUserToOrganizationInput
): Promise<PaginatedResponse<OrganizationUser>> => {
  // Validate and destructure input
  const {
    userId,
    page,
    page_size,
    user_name,
    email,
    query,
    role,
    status,
    force_include_in_search,
  } = GetUserToOrganizationInputSchema.parse(params);

  // Get the user's organization ID
  const userOrg = await getUserOrganizationId(userId);
  if (!userOrg?.organizationId) {
    throw new Error('User not found in any organization');
  }

  const { organizationId } = userOrg;

  try {
    // Handle forced users if provided
    let forcedUsers: OrganizationUser[] = [];
    if (force_include_in_search && force_include_in_search.length > 0) {
      // Fetch forced users that belong to the organization
      forcedUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          role: usersToOrganizations.role,
          status: usersToOrganizations.status,
        })
        .from(users)
        .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
        .where(
          and(
            eq(usersToOrganizations.organizationId, organizationId),
            isNull(usersToOrganizations.deletedAt),
            inArray(users.id, force_include_in_search)
          )
        )
        .orderBy(asc(users.name));
    }

    // Build search conditions
    // If query is provided, search both name and email with it
    // Otherwise, use individual user_name and email filters
    const searchConditions = query
      ? or(like(users.name, `%${query}%`), like(users.email, `%${query}%`))
      : or(
          user_name ? like(users.name, `%${user_name}%`) : undefined,
          email ? like(users.email, `%${email}%`) : undefined
        );

    // Combine conditions: base conditions AND search conditions
    // Exclude forced users from regular query to avoid duplicates
    const whereConditions = and(
      eq(usersToOrganizations.organizationId, organizationId),
      isNull(usersToOrganizations.deletedAt),
      role ? inArray(usersToOrganizations.role, role) : undefined,
      status ? inArray(usersToOrganizations.status, status) : undefined,
      searchConditions,
      force_include_in_search && force_include_in_search.length > 0
        ? not(inArray(users.id, force_include_in_search))
        : undefined
    );

    // Calculate how many regular users we need to fetch
    // If we have forced users, we need fewer regular users to meet page_size
    const regularUsersToFetch = Math.max(0, page_size - forcedUsers.length);

    const getData = withPagination(
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          role: usersToOrganizations.role,
          status: usersToOrganizations.status,
        })
        .from(users)
        .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
        .where(whereConditions)
        .$dynamic(),
      asc(users.name),
      page,
      regularUsersToFetch
    );
    const getTotal = db
      .select({ count: count() })
      .from(users)
      .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
      .where(whereConditions);

    // Execute data and count queries in parallel
    const [regularData, totalResult] = await Promise.all([getData, getTotal]);

    const regularTotal = totalResult[0]?.count ?? 0;

    // Combine forced users with regular users
    // Forced users always come first
    const combinedData = [...forcedUsers, ...regularData];

    // Total includes both forced and regular users
    const total = forcedUsers.length + regularTotal;

    return createPaginatedResponse({
      data: combinedData,
      page,
      page_size,
      total,
    });
  } catch (error) {
    console.error('Error fetching organization users:', error);
    throw new Error('Failed to fetch organization users');
  }
};
