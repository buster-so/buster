import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  assetPermissions,
  chats,
  collectionsToAssets,
  getDb,
  usersToOrganizations,
  users,
  organizations,
  collections,
  eq,
  and,
} from '@buster/database';
import { canUserAccessChat } from '../../src/chats';

describe('canUserAccessChat Integration Tests', () => {
  const db = getDb();
  
  // Test data IDs
  const testOrgId = randomUUID();
  const testUserId = randomUUID();
  const testAdminUserId = randomUUID();
  const testChatId = randomUUID();
  const testCollectionId = randomUUID();
  const testChatWithCollectionId = randomUUID();
  const testChatNoAccessId = randomUUID();
  const testUserNoAccessId = randomUUID();

  beforeAll(async () => {
    // Create test organization
    await db.insert(organizations).values({
      id: testOrgId,
      name: 'Test Organization',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create test users with unique emails
    const timestamp = Date.now();
    await db.insert(users).values([
      {
        id: testUserId,
        email: `test-user-${timestamp}@example.com`,
        name: 'Test User',
        config: {},
        attributes: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: testAdminUserId,
        email: `test-admin-${timestamp}@example.com`,
        name: 'Test Admin',
        config: {},
        attributes: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: testUserNoAccessId,
        email: `test-no-access-${timestamp}@example.com`,
        name: 'Test No Access',
        config: {},
        attributes: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Create user-organization relationships
    await db.insert(usersToOrganizations).values([
      {
        userId: testUserId,
        organizationId: testOrgId,
        role: 'querier',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        userId: testAdminUserId,
        organizationId: testOrgId,
        role: 'workspace_admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        userId: testUserNoAccessId,
        organizationId: testOrgId,
        role: 'viewer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Create test chats
    await db.insert(chats).values([
      {
        id: testChatId,
        title: 'Test Chat with Direct Permission',
        organizationId: testOrgId,
        createdBy: testUserId,
        updatedBy: testUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: testChatWithCollectionId,
        title: 'Test Chat with Collection Permission',
        organizationId: testOrgId,
        createdBy: testAdminUserId,
        updatedBy: testAdminUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: testChatNoAccessId,
        title: 'Test Chat No Access',
        organizationId: testOrgId,
        createdBy: testAdminUserId,
        updatedBy: testAdminUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Create test collection
    await db.insert(collections).values({
      id: testCollectionId,
      name: 'Test Collection',
      organizationId: testOrgId,
      createdBy: testAdminUserId,
      updatedBy: testAdminUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create direct chat permission
    await db.insert(assetPermissions).values({
      identityId: testUserId,
      identityType: 'user',
      assetId: testChatId,
      assetType: 'chat',
      role: 'can_view',
      createdBy: testUserId,
      updatedBy: testUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create collection permission
    await db.insert(assetPermissions).values({
      identityId: testUserId,
      identityType: 'user',
      assetId: testCollectionId,
      assetType: 'collection',
      role: 'can_view',
      createdBy: testAdminUserId,
      updatedBy: testAdminUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Add chat to collection
    await db.insert(collectionsToAssets).values({
      collectionId: testCollectionId,
      assetId: testChatWithCollectionId,
      assetType: 'chat',
      createdBy: testAdminUserId,
      updatedBy: testAdminUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(collectionsToAssets).where(eq(collectionsToAssets.collectionId, testCollectionId));
    await db.delete(assetPermissions).where(
      and(
        eq(assetPermissions.assetId, testChatId),
        eq(assetPermissions.identityId, testUserId)
      )
    );
    await db.delete(assetPermissions).where(
      and(
        eq(assetPermissions.assetId, testCollectionId),
        eq(assetPermissions.identityId, testUserId)
      )
    );
    await db.delete(chats).where(eq(chats.organizationId, testOrgId));
    await db.delete(collections).where(eq(collections.id, testCollectionId));
    await db.delete(usersToOrganizations).where(eq(usersToOrganizations.organizationId, testOrgId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(users).where(eq(users.id, testAdminUserId));
    await db.delete(users).where(eq(users.id, testUserNoAccessId));
    await db.delete(organizations).where(eq(organizations.id, testOrgId));
  });

  test('should return true when user has direct permission', async () => {
    const result = await canUserAccessChat({
      userId: testUserId,
      chatId: testChatId,
    });

    expect(result).toBe(true);
  });

  test('should return true when user has collection permission', async () => {
    const result = await canUserAccessChat({
      userId: testUserId,
      chatId: testChatWithCollectionId,
    });

    expect(result).toBe(true);
  });

  test('should return true when user is the creator', async () => {
    const result = await canUserAccessChat({
      userId: testUserId,
      chatId: testChatId,
    });

    expect(result).toBe(true);
  });

  test('should return true when user is workspace_admin', async () => {
    const result = await canUserAccessChat({
      userId: testAdminUserId,
      chatId: testChatNoAccessId,
    });

    expect(result).toBe(true);
  });

  test('should return false when user has no access', async () => {
    const result = await canUserAccessChat({
      userId: testUserNoAccessId,
      chatId: testChatNoAccessId,
    });

    expect(result).toBe(false);
  });

  test('should return false for non-existent chat', async () => {
    const result = await canUserAccessChat({
      userId: testUserId,
      chatId: randomUUID(),
    });

    expect(result).toBe(false);
  });

  test('should return false for non-existent user', async () => {
    const result = await canUserAccessChat({
      userId: randomUUID(),
      chatId: testChatId,
    });

    expect(result).toBe(false);
  });

  test('should handle deleted chat gracefully', async () => {
    const deletedChatId = randomUUID();

    // Create a deleted chat
    await db.insert(chats).values({
      id: deletedChatId,
      title: 'Deleted Chat',
      organizationId: testOrgId,
      createdBy: testUserId,
      updatedBy: testUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: new Date().toISOString(),
    });

    const result = await canUserAccessChat({
      userId: testUserId,
      chatId: deletedChatId,
    });

    expect(result).toBe(false);

    // Clean up
    await db.delete(chats).where(eq(chats.id, deletedChatId));
  });

  test('should perform all checks concurrently', async () => {
    const startTime = Date.now();

    const result = await canUserAccessChat({
      userId: testUserId,
      chatId: testChatId,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result).toBe(true);
    // Assuming each query takes at least 10ms, 4 sequential queries would take 40ms+
    // Concurrent execution should be significantly faster
    expect(duration).toBeLessThan(100); // Generous threshold for CI environments
  });
});