import { z } from 'zod';

// Re-export all internal types
export * from './types/asset-permissions';
export * from './types/cascading-permissions';
export * from './types/dataset-permissions';
export * from './types/errors';

// Custom error class for access control operations (legacy - use AccessControlError instead)
export class AccessControlsError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AccessControlsError';
  }
}

// Basic permission interface
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

// Basic role interface
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

// Access control options interface
export interface AccessControlOptions {
  userId: string;
  resourceId?: string;
  resourceType: string;
  action: string;
}

// Zod schemas for validation
export const PermissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  resource: z.string().min(1),
  action: z.string().min(1),
});

export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(PermissionSchema),
});

export const AccessControlOptionsSchema = z.object({
  userId: z.string().uuid(),
  resourceId: z.string().uuid().optional(),
  resourceType: z.string().min(1),
  action: z.string().min(1),
});
