# Access Controls Package - Claude Guidance

This package provides comprehensive access control functionality for Buster, migrated from the Rust `sharing` and `dataset_security` libraries.

## Key Implementation Details

### Migration Status
- ✅ Asset permissions (from `sharing` library)
- ✅ Dataset permissions (from `dataset_security` library)  
- ✅ Cascading permissions
- ✅ LRU caching (replacing Redis)
- ✅ User lookup utilities
- ✅ Tests written (148 tests passing, 3 skipped)
- ⏳ Integration with existing handlers needs to be done

### Architecture Decisions

1. **Type Organization**
   - Internal types live in `src/types/`
   - API request/response types live in `@buster/server-shared`
   - Database queries live in `@buster/database`

2. **Caching Strategy**
   - Using LRU cache instead of Redis (as requested)
   - 30-second TTL with updateAgeOnGet
   - Separate caches for permissions and cascading checks
   - Comprehensive invalidation strategies

3. **Error Handling**
   - All errors throw `AccessControlError` with specific codes
   - Errors include context for debugging
   - Consistent error patterns across modules

### Key Functions

#### Asset Permissions
- `hasAssetPermission` - Main permission check (includes caching)
- `createPermissionByEmail` - Grant access by email
- `listPermissions` - List all permissions for an asset
- `removePermissionByEmail` - Revoke access

#### Dataset Permissions  
- `getPermissionedDatasets` - Get all accessible datasets
- `checkDatasetAccess` - Check access to specific dataset
- `checkMultipleDatasetAccess` - Batch access check

#### Cascading Permissions
- Metrics inherit from dashboards, chats, collections
- Dashboards inherit from chats, collections
- Chats inherit from collections

### Performance Optimizations

1. **Caching**
   - Permission results cached for 30 seconds
   - Cascading checks cached separately
   - Cache invalidation on permission changes

2. **Database Queries**
   - Optimized queries in `@buster/database`
   - Batch operations where possible
   - Proper indexing assumed

### Integration Points

1. **With Existing Code**
   - Legacy exports maintained for backward compatibility
   - Drop-in replacement for Rust libraries
   - Same permission model and roles

2. **With Other Packages**
   - Uses `@buster/database` for data access
   - Uses `@buster/database/supabase` for user creation
   - Exports to `@buster/server-shared` for API types

### Testing Strategy

Tests should cover:
1. Permission CRUD operations
2. Cascading permission logic
3. Cache behavior and invalidation
4. Error scenarios
5. Legacy compatibility

### Common Patterns

```typescript
// Always check permissions before operations
const canEdit = await hasAssetPermission({
  userId,
  assetId,
  assetType: 'dashboard',
  requiredRole: 'can_edit'
});

if (!canEdit) {
  throw new AccessControlError('permission_denied', 'Cannot edit dashboard');
}

// Invalidate cache after changes
await createPermissionByEmail({ ... });
invalidateUserAsset(userId, assetId, assetType);
```

### Future Improvements

1. Consider caching full permission results (not just booleans)
2. Add metrics/monitoring for cache performance
3. Implement permission inheritance for teams
4. Add audit logging for permission changes

### Debugging Tips

1. Use `getCacheStats()` to monitor cache performance
2. Check `AccessControlError.details` for context
3. Enable debug logging in database queries
4. Use `clearAllCaches()` to test without cache

### Important Notes

- Never hard delete permissions (soft delete only)
- Always use upsert logic for permission creation
- Cache invalidation is critical for correctness
- Test cascading permissions thoroughly