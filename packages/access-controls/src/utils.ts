import { z } from 'zod';

// Utility function to format permission names consistently
export function formatPermissionName(resource: string, action: string): string {
  return `${resource}:${action}`.toLowerCase();
}

// Utility function to build access query conditions (placeholder for future use)
export function buildAccessQuery(userId: string, resourceType: string): Record<string, unknown> {
  return {
    userId,
    resourceType,
    // Additional query building logic can be added here
  };
}

// Utility function to validate UUID format
export function isValidUuid(value: string): boolean {
  const uuidSchema = z.string().uuid();
  return uuidSchema.safeParse(value).success;
}

// Utility function to normalize role names
export function normalizeRoleName(role: string): string {
  return role.toLowerCase().replace(/\s+/g, '_');
}

// Utility function to check if a user has admin-level permissions
export function isAdminRole(role: string): boolean {
  const adminRoles = ['workspace_admin', 'data_admin', 'querier'];
  return adminRoles.includes(role.toLowerCase());
}

// Utility function to deduplicate array of IDs
export function deduplicateIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

// Utility function to validate pagination parameters
export function validatePagination(
  page: number,
  pageSize: number
): { page: number; pageSize: number } {
  const PaginationSchema = z.object({
    page: z.number().int().min(0),
    pageSize: z.number().int().min(1).max(1000),
  });

  return PaginationSchema.parse({ page, pageSize });
}
