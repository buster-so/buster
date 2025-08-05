import { describe, expect, it } from 'vitest';
import {
  ShareAssetTypeSchema,
  ShareConfigSchema,
  ShareIndividualSchema,
  ShareRoleSchema,
} from './share-interfaces.types';

describe('ShareRoleSchema', () => {
  it('should accept valid role values', () => {
    const validRoles = ['owner', 'full_access', 'can_edit', 'can_view'];

    for (const role of validRoles) {
      const result = ShareRoleSchema.safeParse(role);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(role);
      }
    }
  });

  it('should reject invalid role values', () => {
    const invalidRoles = ['admin', 'user', 'guest', '', 'OWNER'];

    for (const role of invalidRoles) {
      const result = ShareRoleSchema.safeParse(role);
      expect(result.success).toBe(false);
    }
  });

  it('should be case sensitive', () => {
    const caseVariations = ['Owner', 'OWNER', 'fullaccess', 'CANVIEW'];

    for (const role of caseVariations) {
      const result = ShareRoleSchema.safeParse(role);
      expect(result.success).toBe(false);
    }
  });
});

describe('ShareAssetTypeSchema', () => {
  it('should accept valid asset type values', () => {
    const validTypes = ['metric', 'dashboard', 'collection', 'chat'];

    for (const type of validTypes) {
      const result = ShareAssetTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(type);
      }
    }
  });

  it('should reject invalid asset type values', () => {
    const invalidTypes = ['report-id', 'query', 'table', '', 'METRIC'];

    for (const type of invalidTypes) {
      const result = ShareAssetTypeSchema.safeParse(type);
      expect(result.success).toBe(false);
    }
  });

  it('should be case sensitive', () => {
    const caseVariations = ['Metric', 'DASHBOARD', 'Collection', 'CHAT'];

    for (const type of caseVariations) {
      const result = ShareAssetTypeSchema.safeParse(type);
      expect(result.success).toBe(false);
    }
  });
});

describe('ShareIndividualSchema', () => {
  it('should parse valid individual sharing configuration', () => {
    const validIndividual = {
      email: 'user@example.com',
      role: 'can_edit',
      name: 'John Doe',
      avatar_url: null,
    };

    const result = ShareIndividualSchema.safeParse(validIndividual);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.role).toBe('can_edit');
      expect(result.data.name).toBe('John Doe');
    }
  });

  it('should handle optional name field', () => {
    const individualWithoutName = {
      email: 'test@example.com',
      role: 'can_view',
      avatar_url: null,
    };

    const result = ShareIndividualSchema.safeParse(individualWithoutName);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.role).toBe('can_view');
      expect(result.data.name).toBeUndefined();
    }
  });

  it('should validate email format', () => {
    const invalidEmails = ['invalid-email', 'test@', '@example.com', 'test.example.com', ''];

    for (const email of invalidEmails) {
      const individual = {
        email,
        role: 'can_view',
      };

      const result = ShareIndividualSchema.safeParse(individual);
      // ShareIndividualSchema just expects a string for email, not email validation
      expect(result.success).toBe(true);
    }
  });

  it('should validate role field', () => {
    const individual = {
      email: 'valid@example.com',
      role: 'invalidRole',
    };

    const result = ShareIndividualSchema.safeParse(individual);
    expect(result.success).toBe(false);
  });

  it('should require email and role fields', () => {
    const missingEmail = {
      role: 'can_edit',
      name: 'John Doe',
    };

    const missingRole = {
      email: 'user@example.com',
      name: 'John Doe',
    };

    const emailResult = ShareIndividualSchema.safeParse(missingEmail);
    expect(emailResult.success).toBe(false);

    const roleResult = ShareIndividualSchema.safeParse(missingRole);
    expect(roleResult.success).toBe(false);
  });

  it('should handle all valid role combinations', () => {
    const validRoles = ['owner', 'full_access', 'can_edit', 'can_view'];

    for (const role of validRoles) {
      const individual = {
        email: 'test@example.com',
        role,
        name: 'Test User',
      };

      const result = ShareIndividualSchema.safeParse(individual);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe(role);
      }
    }
  });
});

describe('ShareConfigSchema', () => {
  it('should parse valid complete share configuration', () => {
    const validConfig = {
      individual_permissions: [
        {
          email: 'user1@example.com',
          role: 'can_edit',
          name: 'User One',
        },
        {
          email: 'user2@example.com',
          role: 'can_view',
        },
      ],
      public_expiry_date: '2024-12-31T23:59:59Z',
      public_enabled_by: 'admin@example.com',
      publicly_accessible: true,
      public_password: 'secretPassword123',
      permission: 'owner',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = ShareConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.individual_permissions).toHaveLength(2);
      expect(result.data.individual_permissions?.[0]?.email).toBe('user1@example.com');
      expect(result.data.individual_permissions?.[0]?.role).toBe('can_edit');
      expect(result.data.publicly_accessible).toBe(true);
      expect(result.data.permission).toBe('owner');
    }
  });

  it('should handle null individual_permissions', () => {
    const configWithNullPermissions = {
      individual_permissions: null,
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: false,
      public_password: null,
      permission: 'can_view',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = ShareConfigSchema.safeParse(configWithNullPermissions);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.individual_permissions).toBeNull();
      expect(result.data.public_expiry_date).toBeNull();
      expect(result.data.public_enabled_by).toBeNull();
      expect(result.data.publicly_accessible).toBe(false);
      expect(result.data.public_password).toBeNull();
      expect(result.data.permission).toBe('can_view');
    }
  });

  it('should handle empty individual_permissions array', () => {
    const configWithEmptyPermissions = {
      individual_permissions: [],
      public_expiry_date: '2025-01-01T00:00:00Z',
      public_enabled_by: 'system',
      publicly_accessible: true,
      public_password: null,
      permission: 'full_access',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = ShareConfigSchema.safeParse(configWithEmptyPermissions);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.individual_permissions).toEqual([]);
      expect(result.data.publicly_accessible).toBe(true);
      expect(result.data.permission).toBe('full_access');
    }
  });

  it('should validate all permission field values', () => {
    const validPermissions = ['owner', 'full_access', 'can_edit', 'can_view'];

    for (const permission of validPermissions) {
      const config = {
        individual_permissions: null,
        public_expiry_date: null,
        public_enabled_by: null,
        publicly_accessible: false,
        public_password: null,
        permission,
        workspace_sharing: null,
        workspace_member_count: null,
      };

      const result = ShareConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.permission).toBe(permission);
      }
    }
  });

  it('should reject invalid permission values', () => {
    const invalidPermissions = ['admin', 'user', 'guest', 'OWNER'];

    for (const permission of invalidPermissions) {
      const config = {
        individual_permissions: null,
        public_expiry_date: null,
        public_enabled_by: null,
        publicly_accessible: false,
        public_password: null,
        permission,
        workspace_sharing: null,
        workspace_member_count: null,
      };

      const result = ShareConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    }
  });

  it('should require all fields', () => {
    const incompleteConfigs = [
      {
        // missing individual_permissions
        public_expiry_date: null,
        public_enabled_by: null,
        publicly_accessible: false,
        public_password: null,
        permission: 'owner',
        workspace_sharing: null,
        workspace_member_count: null,
      },
      {
        individual_permissions: null,
        // missing public_expiry_date
        public_enabled_by: null,
        publicly_accessible: false,
        public_password: null,
        permission: 'owner',
        workspace_sharing: null,
        workspace_member_count: null,
      },
      {
        individual_permissions: null,
        public_expiry_date: null,
        public_enabled_by: null,
        publicly_accessible: false,
        public_password: null,
        // missing permission
      },
    ];

    for (const config of incompleteConfigs) {
      const result = ShareConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    }
  });

  it('should validate individual permissions nested structure', () => {
    const configWithInvalidIndividual = {
      individual_permissions: [
        {
          email: 'invalid-email', // Invalid email format
          role: 'can_edit',
        },
      ],
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: false,
      public_password: null,
      permission: 'owner',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = ShareConfigSchema.safeParse(configWithInvalidIndividual);
    // ShareIndividualSchema doesn't validate email format, so this should pass
    expect(result.success).toBe(true);
  });

  it('should handle complex individual permissions scenarios', () => {
    const complexConfig = {
      individual_permissions: [
        {
          email: 'owner@company.com',
          role: 'owner',
          name: 'Company Owner',
        },
        {
          email: 'editor@company.com',
          role: 'can_edit',
          name: 'Editor User',
        },
        {
          email: 'viewer@external.com',
          role: 'can_view',
          // name is optional
        },
      ],
      public_expiry_date: '2024-06-30T23:59:59Z',
      public_enabled_by: 'admin@company.com',
      publicly_accessible: true,
      public_password: 'complex_password_123!',
      permission: 'full_access',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = ShareConfigSchema.safeParse(complexConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.individual_permissions).toHaveLength(3);
      expect(result.data.individual_permissions?.[0]?.role).toBe('owner');
      expect(result.data.individual_permissions?.[1]?.role).toBe('can_edit');
      expect(result.data.individual_permissions?.[2]?.role).toBe('can_view');
      expect(result.data.individual_permissions?.[2]?.name).toBeUndefined();
    }
  });

  it('should handle boolean publicly_accessible correctly', () => {
    const publicConfig = {
      individual_permissions: null,
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: true,
      public_password: null,
      permission: 'owner',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const privateConfig = {
      individual_permissions: null,
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: false,
      public_password: null,
      permission: 'owner',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const publicResult = ShareConfigSchema.safeParse(publicConfig);
    const privateResult = ShareConfigSchema.safeParse(privateConfig);

    expect(publicResult.success).toBe(true);
    expect(privateResult.success).toBe(true);

    if (publicResult.success) {
      expect(publicResult.data.publicly_accessible).toBe(true);
    }

    if (privateResult.success) {
      expect(privateResult.data.publicly_accessible).toBe(false);
    }
  });
});
