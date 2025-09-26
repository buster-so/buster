import { type InferSelectModel, and, asc, count, eq, inArray, isNull, like, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import {
  userOrganizationRoleEnum,
  userOrganizationStatusEnum,
  users,
  usersToOrganizations,
} from '../../schema';
import { UserOrganizationRoleSchema, UserOrganizationStatusSchema } from '../../schema-types';
import {
  type PaginatedResponse,
  createPaginatedResponse,
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
  role: z.array(UserOrganizationRoleSchema).optional(),
  status: z.array(UserOrganizationStatusSchema).optional(),
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
  const { userId, page, page_size, user_name, email, role, status } =
    GetUserToOrganizationInputSchema.parse(params);

  // Get the user's organization ID
  const userOrg = await getUserOrganizationId(userId);
  if (!userOrg?.organizationId) {
    throw new Error('User not found in any organization');
  }

  const { organizationId } = userOrg;

  // Combine conditions: base conditions AND (name OR email)
  const whereConditions = and(
    eq(usersToOrganizations.organizationId, organizationId),
    isNull(usersToOrganizations.deletedAt),
    role ? inArray(usersToOrganizations.role, role) : undefined,
    status ? inArray(usersToOrganizations.status, status) : undefined,
    or(
      user_name ? like(users.name, `%${user_name}%`) : undefined,
      email ? like(users.email, `%${email}%`) : undefined
    )
  );

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
    page_size
  );
  const getTotal = db
    .select({ count: count() })
    .from(users)
    .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
    .where(whereConditions);

  try {
    // Execute data and count queries in parallel
    const [data, totalResult] = await Promise.all([getData, getTotal]);

    const total = totalResult[0]?.count ?? 0;

    return createPaginatedResponse({
      data,
      page,
      page_size,
      total,
    });
  } catch (error) {
    console.error('Error fetching organization users:', error);
    throw new Error('Failed to fetch organization users');
  }
};
