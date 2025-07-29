# @buster/access-controls

Comprehensive access control system for Buster, providing permission management for assets and datasets.

## Overview

This package implements a flexible, performant access control system that supports:
- Asset-based permissions (dashboards, metrics, chats, collections)
- Dataset permissions with multiple access paths
- Cascading permissions (e.g., access to a dashboard grants view access to its metrics)
- LRU caching for performance optimization
- User and team-based access control

## Installation

```bash
pnpm add @buster/access-controls
```

## Usage

### Asset Permissions

#### Checking Permissions

```typescript
import { hasAssetPermission } from '@buster/access-controls';

// Check if user can view a dashboard
const canView = await hasAssetPermission({
  userId: 'user-123',
  assetId: 'dashboard-456',
  assetType: 'dashboard',
  requiredRole: 'can_view',
});
```

#### Creating Permissions

```typescript
import { createPermissionByEmail } from '@buster/access-controls';

// Grant edit access to a user by email
await createPermissionByEmail({
  assetId: 'dashboard-456',
  assetType: 'dashboard',
  email: 'user@example.com',
  role: 'can_edit',
  createdBy: 'admin-user-id',
  organizationId: 'org-123', // optional
});
```

#### Listing Permissions

```typescript
import { listPermissions } from '@buster/access-controls';

// Get all permissions for an asset
const permissions = await listPermissions({
  assetId: 'dashboard-456',
  assetType: 'dashboard',
});
```

### Dataset Permissions

#### Checking Access

```typescript
import { checkDatasetAccess } from '@buster/access-controls';

// Check if user has access to a dataset
const result = await checkDatasetAccess({
  userId: 'user-123',
  datasetId: 'dataset-789',
});

console.log(result.hasAccess); // true/false
console.log(result.accessPath); // 'direct_user', 'user_to_team', etc.
```

#### Getting Permissioned Datasets

```typescript
import { getPermissionedDatasets } from '@buster/access-controls';

// Get all datasets user can access
const { datasets, total } = await getPermissionedDatasets({
  userId: 'user-123',
  page: 0,
  pageSize: 20,
});
```

### Cascading Permissions

The system automatically handles cascading permissions:

- **Metrics** inherit view permissions from:
  - Dashboards that contain them
  - Chats that reference them
  - Collections they belong to

- **Dashboards** inherit view permissions from:
  - Chats that reference them
  - Collections they belong to

- **Chats** inherit view permissions from:
  - Collections they belong to

### User Lookup

```typescript
import { findUserByEmail, findUsersByEmails } from '@buster/access-controls';

// Find a single user
const user = await findUserByEmail('user@example.com', {
  createIfNotExists: true, // Auto-create user if not found
});

// Find multiple users
const result = await findUsersByEmails(['user1@example.com', 'user2@example.com']);
console.log(result.users); // Found users
console.log(result.notFound); // Emails not found
console.log(result.created); // Users created (if createIfNotExists: true)
```

## Caching

The package includes built-in LRU caching for performance:

### Cache Statistics

```typescript
import { getCacheStats } from '@buster/access-controls';

const stats = getCacheStats();
console.log(stats);
// {
//   permission: { hits: 100, misses: 20, hitRate: '83.33%', ... },
//   cascading: { hits: 50, misses: 10, hitRate: '83.33%', ... }
// }
```

### Cache Invalidation

```typescript
import { 
  invalidateUser, 
  invalidateAsset,
  invalidateUserAsset,
  clearAllCaches 
} from '@buster/access-controls';

// Invalidate all permissions for a user
invalidateUser('user-123');

// Invalidate all permissions for an asset
invalidateAsset('dashboard-456', 'dashboard');

// Invalidate specific user-asset combination
invalidateUserAsset('user-123', 'dashboard-456', 'dashboard');

// Clear all caches (useful for testing)
clearAllCaches();
```

## Permission Roles

Asset permissions support the following roles (in order of access level):
- `owner` - Full control including delete
- `full_access` - All operations except delete
- `can_edit` - Modify the asset
- `can_filter` - Apply filters (dashboards/metrics)
- `can_view` - Read-only access

## Workspace Sharing

Assets can be shared at the workspace level:
- `none` - No workspace sharing
- `can_view` - All workspace members can view
- `can_edit` - All workspace members can edit
- `full_access` - All workspace members have full access

## Error Handling

All functions throw `AccessControlError` with specific error codes:

```typescript
try {
  await hasAssetPermission({ ... });
} catch (error) {
  if (error instanceof AccessControlError) {
    console.log(error.code); // 'permission_denied', 'user_not_found', etc.
    console.log(error.message);
    console.log(error.details); // Additional error context
  }
}
```

## Legacy Support

The package maintains backward compatibility with existing code:

```typescript
// Legacy function names still work
import { 
  legacyCheckPermission,
  legacyGetPermissionedDatasets,
  canUserAccessChat,
  canUserAccessChatCached 
} from '@buster/access-controls';
```

## Architecture

The package is organized into modules:

- **assets/** - Asset permission management
  - `permissions.ts` - CRUD operations for permissions
  - `checks.ts` - Permission checking logic
  - `cascading-permissions.ts` - Cascading permission rules
  - `cache.ts` - LRU caching implementation

- **datasets/** - Dataset permission management
  - `permissions.ts` - Dataset access control
  - `cache.ts` - Dataset-specific caching

- **users/** - User management utilities
  - `lookup.ts` - User search and creation

- **types/** - TypeScript type definitions
  - `asset-permissions.ts` - Asset permission types
  - `dataset-permissions.ts` - Dataset permission types
  - `errors.ts` - Error types

## Performance Considerations

1. **Caching**: All permission checks are cached for 30 seconds with LRU eviction
2. **Batch Operations**: Use bulk functions when checking multiple permissions
3. **Cascading Checks**: Cascading permissions are checked lazily and cached separately
4. **Database Queries**: Optimized queries with proper indexes

## Migration from Rust

This package is a TypeScript migration of the Rust `sharing` and `dataset_security` libraries. Key improvements:

1. **Type Safety**: Full TypeScript types with Zod validation
2. **Caching**: Built-in LRU caching (replacing Redis)
3. **Simplified API**: More intuitive function names and parameters
4. **Better Error Handling**: Structured errors with detailed context
5. **Modular Design**: Clean separation of concerns

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Contributing

When adding new features:
1. Update types in the appropriate `types/` file
2. Add database queries to `@buster/database`
3. Implement business logic in the appropriate module
4. Add cache invalidation where needed
5. Write comprehensive tests
6. Update this README

## License

Internal Buster package - see root LICENSE