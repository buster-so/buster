# @buster/access-controls

A TypeScript library for handling dataset access controls and permissions in the Buster platform. This library provides functions to check user permissions across datasets using various access paths including direct user permissions, team permissions, and permission groups.

## Features

- ✅ **Dataset Access Control**: Check if users have access to specific datasets
- ✅ **Bulk Permission Checks**: Verify access to multiple datasets efficiently  
- ✅ **Multiple Access Paths**: Support for direct user, team, and permission group access
- ✅ **Admin Role Support**: Automatic access for workspace admins, data admins, and queriers
- ✅ **Concurrent Processing**: Uses Promise.all for efficient permission checking
- ✅ **TypeScript & Zod**: Full type safety with runtime validation
- ✅ **Drizzle ORM**: Modern database queries with the existing schema

## Installation

This package is part of the Buster workspace and uses workspace dependencies:

```bash
# Install dependencies (from workspace root)
npm install
```

## Usage

### Basic Access Checks

```typescript
import { hasDatasetAccess, hasAllDatasetsAccess } from '@buster/access-controls';

// Check if user has access to a single dataset
const hasAccess = await hasDatasetAccess(userId, datasetId);

// Check if user has access to multiple datasets (all must be accessible)
const hasAllAccess = await hasAllDatasetsAccess(userId, [datasetId1, datasetId2]);
```

### Getting Permissioned Datasets

```typescript
import { getPermissionedDatasets } from '@buster/access-controls';

// Get datasets the user has access to with pagination
const datasets = await getPermissionedDatasets(userId, page, pageSize);
```

### Utility Functions

```typescript
import { 
  formatPermissionName, 
  buildAccessQuery, 
  isValidUuid,
  isAdminRole 
} from '@buster/access-controls';

// Format permission strings consistently
const permission = formatPermissionName('dataset', 'read'); // "dataset:read"

// Validate UUID format
const isValid = isValidUuid('123e4567-e89b-12d3-a456-426614174000'); // true

// Check if role has admin privileges
const isAdmin = isAdminRole('workspace_admin'); // true
```

## Permission Model

This library implements a hierarchical permission system with multiple access paths:

### Access Paths

1. **Direct User Access**: User directly assigned to dataset
2. **Team Access**: User belongs to team that has dataset access  
3. **Permission Group Access**: User belongs to permission group with dataset access
4. **Team → Permission Group**: User belongs to team that belongs to permission group

### Admin Roles

Users with these roles have automatic access to all datasets in their organization:
- `workspace_admin`
- `data_admin` 
- `querier`

### Soft Deletes

The library respects soft deletes (`deleted_at` fields) and will deny access to:
- Deleted datasets
- Deleted user-organization relationships
- Deleted permission group memberships
- Deleted team memberships

## API Reference

### Main Functions

#### `getPermissionedDatasets(userId: string, page: number, pageSize: number): Promise<PermissionedDataset[]>`

Retrieves datasets that a user has access to with pagination.

**Parameters:**
- `userId`: UUID of the user
- `page`: Page number (0-based)
- `pageSize`: Number of results per page (1-1000)

**Returns:** Array of `PermissionedDataset` objects

#### `hasDatasetAccess(userId: string, datasetId: string): Promise<boolean>`

Checks if a user has access to a specific dataset.

**Parameters:**
- `userId`: UUID of the user
- `datasetId`: UUID of the dataset

**Returns:** Boolean indicating access

#### `hasAllDatasetsAccess(userId: string, datasetIds: string[]): Promise<boolean>`

Checks if a user has access to ALL specified datasets.

**Parameters:**
- `userId`: UUID of the user  
- `datasetIds`: Array of dataset UUIDs

**Returns:** Boolean indicating access to all datasets

### Types

```typescript
interface PermissionedDataset {
  id: string;
  name: string;
  ymlFile: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  dataSourceId: string;
}

interface AccessControlOptions {
  userId: string;
  resourceId?: string;
  resourceType: string;
  action: string;
}
```

### Error Handling

The library uses a custom `AccessControlsError` class for specific error conditions:

```typescript
try {
  const hasAccess = await hasDatasetAccess(userId, datasetId);
} catch (error) {
  if (error instanceof AccessControlsError) {
    console.error('Access control error:', error.message, error.code);
  }
}
```

## Performance

- **Concurrent Queries**: Uses `Promise.all` to check multiple permission paths simultaneously
- **Efficient Admin Checks**: Admin users bypass detailed permission checks
- **Bulk Operations**: `hasAllDatasetsAccess` optimizes checks for multiple datasets
- **Database Indexes**: Leverages existing database indexes for fast queries

## Development

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode  
npm run test:coverage      # Run tests with coverage
```

### Building

```bash
npm run build
```

## Database Schema Dependencies

This library depends on these database tables:
- `datasets`
- `dataset_permissions` 
- `datasets_to_permission_groups`
- `permission_groups`
- `permission_groups_to_identities`
- `teams_to_users`
- `users_to_organizations`

## Contributing

1. Follow the existing TypeScript patterns
2. Add appropriate Zod validation for new functions
3. Write unit tests for new functionality
4. Update this README for API changes
5. Use concurrent patterns where beneficial

## License

Part of the Buster platform. See main workspace license. 