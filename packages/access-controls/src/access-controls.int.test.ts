import {
  and,
  dataSources,
  datasetPermissions,
  datasets,
  datasetsToPermissionGroups,
  eq,
  getDb,
  inArray,
  isNull,
  organizations,
  permissionGroups,
  permissionGroupsToIdentities,
  teams,
  teamsToUsers,
  users,
  usersToOrganizations,
} from '@buster/database';
import { v4 as uuidv4 } from 'uuid';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getPermissionedDatasets, hasAllDatasetsAccess, hasDatasetAccess } from './access-controls';

describe('Access Controls Integration Tests - Organization Default Permission Group', () => {
  const db = getDb();

  // Generate fresh test IDs for each test run to avoid conflicts
  let testOrgId: string;
  let testUserId: string;
  let testDataSourceId: string;
  let testDatasetId1: string;
  let testDatasetId2: string;
  let testDatasetId3: string;
  let testDefaultGroupId: string;
  let testOtherUserId: string;
  let testTeamId: string;

  let testIds: {
    organizationIds: string[];
    userIds: string[];
    dataSourceIds: string[];
    datasetIds: string[];
    permissionGroupIds: string[];
    teamIds: string[];
  };

  beforeEach(async () => {
    // Generate fresh IDs for each test
    testOrgId = uuidv4();
    testUserId = uuidv4();
    testDataSourceId = uuidv4();
    testDatasetId1 = uuidv4();
    testDatasetId2 = uuidv4();
    testDatasetId3 = uuidv4();
    testDefaultGroupId = uuidv4();
    testOtherUserId = uuidv4();
    testTeamId = uuidv4();

    testIds = {
      organizationIds: [testOrgId],
      userIds: [testUserId, testOtherUserId],
      dataSourceIds: [testDataSourceId],
      datasetIds: [testDatasetId1, testDatasetId2, testDatasetId3],
      permissionGroupIds: [testDefaultGroupId],
      teamIds: [testTeamId],
    };
    const now = new Date().toISOString();

    // Create organization first
    await db.insert(organizations).values({
      id: testOrgId,
      name: `Test Organization ${testOrgId}`,
      createdAt: now,
      updatedAt: now,
    });

    // Create users
    await db.insert(users).values([
      {
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: testOtherUserId,
        email: `test-${testOtherUserId}@example.com`,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Create data source
    await db.insert(dataSources).values({
      id: testDataSourceId,
      name: 'Test Data Source',
      type: 'postgres',
      secretId: uuidv4(),
      organizationId: testOrgId,
      createdBy: testUserId,
      updatedBy: testUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Create test organization membership with restricted_querier role (no automatic dataset access)
    await db.insert(usersToOrganizations).values({
      userId: testUserId,
      organizationId: testOrgId,
      role: 'restricted_querier',
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    // Create default permission group for the organization
    await db.insert(permissionGroups).values({
      id: testDefaultGroupId,
      name: `default:${testOrgId}`,
      organizationId: testOrgId,
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    // Create test datasets
    await db.insert(datasets).values({
      id: testDatasetId1,
      name: 'Test Dataset 1',
      organizationId: testOrgId,
      dataSourceId: testDataSourceId,
      databaseName: 'test_db_1',
      type: 'table',
      definition: 'SELECT * FROM test_table_1',
      schema: 'public',
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    await db.insert(datasets).values({
      id: testDatasetId2,
      name: 'Test Dataset 2',
      organizationId: testOrgId,
      dataSourceId: testDataSourceId,
      databaseName: 'test_db_2',
      type: 'table',
      definition: 'SELECT * FROM test_table_2',
      schema: 'public',
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    await db.insert(datasets).values({
      id: testDatasetId3,
      name: 'Test Dataset 3',
      organizationId: testOrgId,
      dataSourceId: testDataSourceId,
      databaseName: 'test_db_3',
      type: 'table',
      definition: 'SELECT * FROM test_table_3',
      schema: 'public',
      createdAt: now,
      updatedAt: now,
      createdBy: testUserId,
      updatedBy: testUserId,
    });

    // Add datasets 1 and 2 to the default permission group
    await db.insert(datasetsToPermissionGroups).values({
      datasetId: testDatasetId1,
      permissionGroupId: testDefaultGroupId,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(datasetsToPermissionGroups).values({
      datasetId: testDatasetId2,
      permissionGroupId: testDefaultGroupId,
      createdAt: now,
      updatedAt: now,
    });
  });

  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    await db
      .delete(datasetsToPermissionGroups)
      .where(inArray(datasetsToPermissionGroups.permissionGroupId, testIds.permissionGroupIds));

    await db
      .delete(permissionGroupsToIdentities)
      .where(inArray(permissionGroupsToIdentities.permissionGroupId, testIds.permissionGroupIds));

    await db
      .delete(datasetPermissions)
      .where(inArray(datasetPermissions.datasetId, testIds.datasetIds));

    await db.delete(teamsToUsers).where(inArray(teamsToUsers.userId, testIds.userIds));

    await db.delete(teams).where(inArray(teams.id, testIds.teamIds));

    await db.delete(datasets).where(inArray(datasets.id, testIds.datasetIds));

    await db
      .delete(permissionGroups)
      .where(inArray(permissionGroups.id, testIds.permissionGroupIds));

    await db.delete(dataSources).where(inArray(dataSources.id, testIds.dataSourceIds));

    await db
      .delete(usersToOrganizations)
      .where(inArray(usersToOrganizations.userId, testIds.userIds));

    await db.delete(users).where(inArray(users.id, testIds.userIds));

    await db.delete(organizations).where(inArray(organizations.id, testIds.organizationIds));
  });

  describe('getPermissionedDatasets with org default', () => {
    it('should return datasets in organization default permission group', async () => {
      const datasets = await getPermissionedDatasets(testUserId, 0, 10);

      expect(datasets).toHaveLength(2);
      expect(datasets.map((d) => d.id)).toContain(testDatasetId1);
      expect(datasets.map((d) => d.id)).toContain(testDatasetId2);
      expect(datasets.map((d) => d.id)).not.toContain(testDatasetId3);
    });

    it('should return empty array when user has no organization', async () => {
      const orphanUserId = uuidv4();
      const datasets = await getPermissionedDatasets(orphanUserId, 0, 10);

      expect(datasets).toHaveLength(0);
    });

    it('should return empty array when default permission group does not exist', async () => {
      // Create a new org without default permission group
      const newOrgId = uuidv4();
      const newUserId = uuidv4();

      await db.insert(organizations).values({
        id: newOrgId,
        name: `New Test Organization ${newOrgId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await db.insert(users).values({
        id: newUserId,
        email: `test-${newUserId}@example.com`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await db.insert(usersToOrganizations).values({
        userId: newUserId,
        organizationId: newOrgId,
        role: 'querier',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: newUserId,
        updatedBy: newUserId,
      });

      const datasets = await getPermissionedDatasets(newUserId, 0, 10);
      expect(datasets).toHaveLength(0);

      // Cleanup
      await db.delete(usersToOrganizations).where(eq(usersToOrganizations.userId, newUserId));
      await db.delete(users).where(eq(users.id, newUserId));
      await db.delete(organizations).where(eq(organizations.id, newOrgId));
    });

    it('should not return deleted datasets from default permission group', async () => {
      // Mark dataset1 as deleted
      await db
        .update(datasets)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(datasets.id, testDatasetId1));

      const accessibleDatasets = await getPermissionedDatasets(testUserId, 0, 10);

      expect(accessibleDatasets).toHaveLength(1);
      expect(accessibleDatasets[0].id).toBe(testDatasetId2);

      // Cleanup - restore dataset
      await db.update(datasets).set({ deletedAt: null }).where(eq(datasets.id, testDatasetId1));
    });
  });

  describe('hasDatasetAccess with org default permission', () => {
    it('should grant access to datasets in default permission group', async () => {
      const hasAccess1 = await hasDatasetAccess(testUserId, testDatasetId1);
      const hasAccess2 = await hasDatasetAccess(testUserId, testDatasetId2);
      const hasAccess3 = await hasDatasetAccess(testUserId, testDatasetId3);

      expect(hasAccess1).toBe(true);
      expect(hasAccess2).toBe(true);
      expect(hasAccess3).toBe(false);
    });

    it('should work alongside other permission paths', async () => {
      // Give user direct access to dataset3
      await db.insert(datasetPermissions).values({
        organizationId: testOrgId,
        datasetId: testDatasetId3,
        permissionId: testUserId,
        permissionType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // User should have access to all three datasets now
      const hasAccess1 = await hasDatasetAccess(testUserId, testDatasetId1);
      const hasAccess2 = await hasDatasetAccess(testUserId, testDatasetId2);
      const hasAccess3 = await hasDatasetAccess(testUserId, testDatasetId3);

      expect(hasAccess1).toBe(true); // Via org default
      expect(hasAccess2).toBe(true); // Via org default
      expect(hasAccess3).toBe(true); // Via direct permission
    });

    it('should respect deleted organization membership', async () => {
      // Mark user's organization membership as deleted
      await db
        .update(usersToOrganizations)
        .set({ deletedAt: new Date().toISOString() })
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrgId)
          )
        );

      const hasAccess = await hasDatasetAccess(testUserId, testDatasetId1);
      expect(hasAccess).toBe(false);

      // Cleanup - restore membership
      await db
        .update(usersToOrganizations)
        .set({ deletedAt: null })
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrgId)
          )
        );
    });
  });

  describe('hasAllDatasetsAccess with org default permission', () => {
    it('should grant access to all datasets in default permission group', async () => {
      const hasAccess = await hasAllDatasetsAccess(testUserId, [testDatasetId1, testDatasetId2]);
      expect(hasAccess).toBe(true);
    });

    it('should deny access if any dataset is not accessible', async () => {
      const hasAccess = await hasAllDatasetsAccess(testUserId, [
        testDatasetId1,
        testDatasetId2,
        testDatasetId3,
      ]);
      expect(hasAccess).toBe(false);
    });

    it('should handle mixed permission paths', async () => {
      // Create another user in same org
      await db.insert(usersToOrganizations).values({
        userId: testOtherUserId,
        organizationId: testOrgId,
        role: 'restricted_querier',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: testOtherUserId,
        updatedBy: testOtherUserId,
      });

      // Give other user direct access to dataset3
      await db.insert(datasetPermissions).values({
        organizationId: testOrgId,
        datasetId: testDatasetId3,
        permissionId: testOtherUserId,
        permissionType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Other user should have access to all three datasets
      const hasAccess = await hasAllDatasetsAccess(testOtherUserId, [
        testDatasetId1,
        testDatasetId2,
        testDatasetId3,
      ]);
      expect(hasAccess).toBe(true);
    });
  });

  describe('Integration with admin roles', () => {
    it('should prioritize admin access over org default permission', async () => {
      // Make user an admin
      await db
        .update(usersToOrganizations)
        .set({ role: 'data_admin' })
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrgId)
          )
        );

      // Admin should have access to all datasets including dataset3
      const accessibleDatasets = await getPermissionedDatasets(testUserId, 0, 10);
      expect(accessibleDatasets).toHaveLength(3);

      const hasAccess3 = await hasDatasetAccess(testUserId, testDatasetId3);
      expect(hasAccess3).toBe(true);

      // Cleanup - restore to restricted_querier role
      await db
        .update(usersToOrganizations)
        .set({ role: 'restricted_querier' })
        .where(
          and(
            eq(usersToOrganizations.userId, testUserId),
            eq(usersToOrganizations.organizationId, testOrgId)
          )
        );
    });
  });

  describe('Concurrent access path execution', () => {
    it('should handle all permission paths concurrently without conflicts', async () => {
      // Set up multiple permission paths for the same user

      // 1. User already has org default access to dataset1 and dataset2

      // 2. Give user direct access to dataset3
      await db.insert(datasetPermissions).values({
        organizationId: testOrgId,
        datasetId: testDatasetId3,
        permissionId: testUserId,
        permissionType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Create another permission group and add user to it
      const otherGroupId = uuidv4();
      await db.insert(permissionGroups).values({
        id: otherGroupId,
        name: 'Test Group',
        organizationId: testOrgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: testUserId,
        updatedBy: testUserId,
      });

      await db.insert(permissionGroupsToIdentities).values({
        permissionGroupId: otherGroupId,
        identityId: testUserId,
        identityType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: testUserId,
        updatedBy: testUserId,
      });

      // 4. Add dataset1 to the other group (duplicate access)
      await db.insert(datasetsToPermissionGroups).values({
        datasetId: testDatasetId1,
        permissionGroupId: otherGroupId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Test that all paths work correctly and deduplication happens
      const datasets = await getPermissionedDatasets(testUserId, 0, 10);

      // Should have all 3 datasets with no duplicates
      expect(datasets).toHaveLength(3);
      expect(new Set(datasets.map((d) => d.id)).size).toBe(3); // Ensure no duplicates

      // Cleanup
      await db
        .delete(datasetsToPermissionGroups)
        .where(eq(datasetsToPermissionGroups.permissionGroupId, otherGroupId));
      await db
        .delete(permissionGroupsToIdentities)
        .where(eq(permissionGroupsToIdentities.permissionGroupId, otherGroupId));
      await db.delete(permissionGroups).where(eq(permissionGroups.id, otherGroupId));
    });
  });
});

describe('getPermissionedDatasets Integration Tests', () => {
  const db = getDb();

  // Generate unique IDs for our test users
  const testUserId = 'c2dd64cd-f7f3-4884-bc91-d46ae431901e';
  const noAccessUserId = uuidv4();
  const limitedAccessUserId = uuidv4();
  const testOrgIdForUsers = uuidv4();
  const testDataSourceIdForUsers = uuidv4();
  const salesPersonDatasetId = uuidv4();
  const employeeDeptDatasetId = uuidv4();
  const personPhoneDatasetId = uuidv4();
  const limitedPermissionGroupId = uuidv4();

  beforeAll(async () => {
    const now = new Date().toISOString();

    // Create test organization
    await db.insert(organizations).values({
      id: testOrgIdForUsers,
      name: `Test Org for User Access Tests ${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    });

    // Create test users
    await db.insert(users).values([
      {
        id: noAccessUserId,
        email: `no-access-${noAccessUserId}@test.com`,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: limitedAccessUserId,
        email: `limited-${limitedAccessUserId}@test.com`,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Create user organization memberships
    await db.insert(usersToOrganizations).values([
      {
        userId: noAccessUserId,
        organizationId: testOrgIdForUsers,
        role: 'restricted_querier',
        createdAt: now,
        updatedAt: now,
        createdBy: noAccessUserId,
        updatedBy: noAccessUserId,
      },
      {
        userId: limitedAccessUserId,
        organizationId: testOrgIdForUsers,
        role: 'restricted_querier',
        createdAt: now,
        updatedAt: now,
        createdBy: limitedAccessUserId,
        updatedBy: limitedAccessUserId,
      },
    ]);

    // Create data source
    await db.insert(dataSources).values({
      id: testDataSourceIdForUsers,
      name: 'Test Data Source for User Access',
      type: 'postgres',
      secretId: uuidv4(),
      organizationId: testOrgIdForUsers,
      createdBy: limitedAccessUserId,
      updatedBy: limitedAccessUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Create test datasets with unique database names
    await db.insert(datasets).values([
      {
        id: salesPersonDatasetId,
        name: 'sales_person',
        organizationId: testOrgIdForUsers,
        dataSourceId: testDataSourceIdForUsers,
        databaseName: `test_db_sales_${Date.now()}`,
        type: 'table',
        definition: 'SELECT * FROM sales_person',
        schema: 'public',
        createdAt: now,
        updatedAt: now,
        createdBy: limitedAccessUserId,
        updatedBy: limitedAccessUserId,
      },
      {
        id: employeeDeptDatasetId,
        name: 'employee_department_history',
        organizationId: testOrgIdForUsers,
        dataSourceId: testDataSourceIdForUsers,
        databaseName: `test_db_emp_${Date.now()}`,
        type: 'table',
        definition: 'SELECT * FROM employee_department_history',
        schema: 'public',
        createdAt: now,
        updatedAt: now,
        createdBy: limitedAccessUserId,
        updatedBy: limitedAccessUserId,
      },
      {
        id: personPhoneDatasetId,
        name: 'person_phone',
        organizationId: testOrgIdForUsers,
        dataSourceId: testDataSourceIdForUsers,
        databaseName: `test_db_person_${Date.now()}`,
        type: 'table',
        definition: 'SELECT * FROM person_phone',
        schema: 'public',
        createdAt: now,
        updatedAt: now,
        createdBy: limitedAccessUserId,
        updatedBy: limitedAccessUserId,
      },
    ]);

    // Create permission group for limited access user
    await db.insert(permissionGroups).values({
      id: limitedPermissionGroupId,
      name: 'Limited Access Group',
      organizationId: testOrgIdForUsers,
      createdBy: limitedAccessUserId,
      updatedBy: limitedAccessUserId,
      createdAt: now,
      updatedAt: now,
    });

    // Add limited user to permission group
    await db.insert(permissionGroupsToIdentities).values({
      permissionGroupId: limitedPermissionGroupId,
      identityId: limitedAccessUserId,
      identityType: 'user',
      createdAt: now,
      updatedAt: now,
      createdBy: limitedAccessUserId,
      updatedBy: limitedAccessUserId,
    });

    // Add only person_phone dataset to the permission group
    await db.insert(datasetsToPermissionGroups).values({
      datasetId: personPhoneDatasetId,
      permissionGroupId: limitedPermissionGroupId,
      createdAt: now,
      updatedAt: now,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db
      .delete(datasetsToPermissionGroups)
      .where(eq(datasetsToPermissionGroups.permissionGroupId, limitedPermissionGroupId));

    await db
      .delete(permissionGroupsToIdentities)
      .where(eq(permissionGroupsToIdentities.permissionGroupId, limitedPermissionGroupId));

    await db.delete(permissionGroups).where(eq(permissionGroups.id, limitedPermissionGroupId));

    await db.delete(datasets).where(eq(datasets.organizationId, testOrgIdForUsers));

    await db.delete(dataSources).where(eq(dataSources.id, testDataSourceIdForUsers));

    await db
      .delete(usersToOrganizations)
      .where(eq(usersToOrganizations.organizationId, testOrgIdForUsers));

    await db.delete(users).where(inArray(users.id, [noAccessUserId, limitedAccessUserId]));

    await db.delete(organizations).where(eq(organizations.id, testOrgIdForUsers));
  });

  describe('User Dataset Access - Full Access User', () => {
    it('should return datasets for user including sales_person dataset', async () => {
      // Get datasets with a reasonable page size to get all results
      const result = await getPermissionedDatasets(testUserId, 0, 100);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check if sales_person dataset is in the results
      const salesPersonDataset = result.find((dataset) => dataset.name === 'sales_person');
      expect(salesPersonDataset).toBeDefined();
      expect(salesPersonDataset?.name).toBe('sales_person');

      // Verify dataset structure
      if (salesPersonDataset) {
        expect(salesPersonDataset).toHaveProperty('id');
        expect(salesPersonDataset).toHaveProperty('name');
        expect(salesPersonDataset).toHaveProperty('ymlFile');
        expect(salesPersonDataset).toHaveProperty('createdAt');
        expect(salesPersonDataset).toHaveProperty('updatedAt');
        expect(salesPersonDataset).toHaveProperty('deletedAt');
        expect(salesPersonDataset).toHaveProperty('dataSourceId');

        expect(typeof salesPersonDataset.id).toBe('string');
        expect(typeof salesPersonDataset.name).toBe('string');
        expect(typeof salesPersonDataset.dataSourceId).toBe('string');
      }

      console.info(`Found ${result.length} datasets for user ${testUserId}`);
      console.info(`Sales person dataset found: ${salesPersonDataset ? 'YES' : 'NO'}`);
    });

    it('should return datasets in alphabetical order', async () => {
      const result = await getPermissionedDatasets(testUserId, 0, 100);

      expect(result.length).toBeGreaterThan(0);

      // Check if datasets are sorted alphabetically by name
      for (let i = 1; i < result.length; i++) {
        expect(result[i].name.localeCompare(result[i - 1].name)).toBeGreaterThanOrEqual(0);
      }

      // Sales person should be in the sorted position if it exists
      const salesPersonIndex = result.findIndex((d) => d.name === 'sales_person');
      if (salesPersonIndex >= 0) {
        if (salesPersonIndex > 0) {
          expect(
            result[salesPersonIndex - 1].name.localeCompare('sales_person')
          ).toBeLessThanOrEqual(0);
        }

        if (salesPersonIndex < result.length - 1) {
          expect(
            'sales_person'.localeCompare(result[salesPersonIndex + 1].name)
          ).toBeLessThanOrEqual(0);
        }
      }
    });

    it('should handle pagination correctly', async () => {
      // Test with different page sizes
      const page1 = await getPermissionedDatasets(testUserId, 0, 10);
      expect(page1.length).toBeLessThanOrEqual(10);

      const page2 = await getPermissionedDatasets(testUserId, 0, 50);
      expect(page2.length).toBeLessThanOrEqual(50);

      // If we have more than 10 datasets, page2 should have more results than page1
      if (page2.length > 10) {
        expect(page2.length).toBeGreaterThan(page1.length);
      }

      // Test pagination offset
      if (page1.length === 10) {
        const nextPage = await getPermissionedDatasets(testUserId, 1, 10);
        // Next page should either have results or be empty
        expect(Array.isArray(nextPage)).toBe(true);

        // If next page has results, they should be different from first page
        if (nextPage.length > 0) {
          const firstPageIds = new Set(page1.map((d) => d.id));
          const nextPageIds = new Set(nextPage.map((d) => d.id));
          const intersection = new Set(Array.from(firstPageIds).filter((x) => nextPageIds.has(x)));
          expect(intersection.size).toBe(0); // No overlap between pages
        }
      }
    });

    it('should return expected number of datasets based on permissions', async () => {
      // Get all datasets for the user
      const allDatasets = await getPermissionedDatasets(testUserId, 0, 1000);

      expect(Array.isArray(allDatasets)).toBe(true);
      expect(allDatasets.length).toBeGreaterThan(0);

      // All datasets should have valid structure
      for (const dataset of allDatasets) {
        expect(dataset).toHaveProperty('id');
        expect(dataset).toHaveProperty('name');
        expect(dataset).toHaveProperty('dataSourceId');
        expect(typeof dataset.id).toBe('string');
        expect(typeof dataset.name).toBe('string');
        expect(typeof dataset.dataSourceId).toBe('string');
      }

      // Check for unique dataset IDs
      const uniqueIds = new Set(allDatasets.map((d) => d.id));
      expect(uniqueIds.size).toBe(allDatasets.length);

      console.info(`Total datasets accessible by user: ${allDatasets.length}`);
    });
  });

  describe('User Dataset Access - No Access User', () => {
    it('should return empty array for user with no dataset access', async () => {
      const result = await getPermissionedDatasets(noAccessUserId, 0, 100);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);

      console.info(`User ${noAccessUserId} has access to ${result.length} datasets (expected: 0)`);
    });

    it('should handle pagination correctly for user with no access', async () => {
      // Test different page configurations
      const page1 = await getPermissionedDatasets(noAccessUserId, 0, 10);
      const page2 = await getPermissionedDatasets(noAccessUserId, 1, 10);
      const largePage = await getPermissionedDatasets(noAccessUserId, 0, 100);

      expect(page1.length).toBe(0);
      expect(page2.length).toBe(0);
      expect(largePage.length).toBe(0);
    });
  });

  describe('User Dataset Access - Limited Access User', () => {
    it('should verify limited access user has access to person_phone dataset only', async () => {
      const result = await getPermissionedDatasets(limitedAccessUserId, 0, 100);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);

      console.info(`User ${limitedAccessUserId} has access to ${result.length} datasets`);

      // Log all accessible dataset names for debugging
      const datasetNames = result.map((d) => d.name).sort();
      console.info(`Accessible datasets: ${datasetNames.join(', ')}`);

      // Check for dataset access
      const personPhoneDataset = result.find((dataset) => dataset.name === 'person_phone');
      const salesPersonDataset = result.find((dataset) => dataset.name === 'sales_person');
      const employeeDeptHistoryDataset = result.find(
        (dataset) => dataset.name === 'employee_department_history'
      );

      console.info(`Person phone dataset found: ${personPhoneDataset ? 'YES' : 'NO'}`);
      console.info(`Sales person dataset found: ${salesPersonDataset ? 'YES' : 'NO'}`);
      console.info(
        `Employee department history dataset found: ${employeeDeptHistoryDataset ? 'YES' : 'NO'}`
      );

      // This user should have access to person_phone dataset only
      expect(personPhoneDataset).toBeDefined();
      expect(personPhoneDataset?.name).toBe('person_phone');

      // Verify dataset structure for person_phone
      if (personPhoneDataset) {
        expect(personPhoneDataset).toHaveProperty('id');
        expect(personPhoneDataset).toHaveProperty('name');
        expect(personPhoneDataset).toHaveProperty('ymlFile');
        expect(personPhoneDataset).toHaveProperty('createdAt');
        expect(personPhoneDataset).toHaveProperty('updatedAt');
        expect(personPhoneDataset).toHaveProperty('deletedAt');
        expect(personPhoneDataset).toHaveProperty('dataSourceId');

        expect(typeof personPhoneDataset.id).toBe('string');
        expect(typeof personPhoneDataset.name).toBe('string');
        expect(typeof personPhoneDataset.dataSourceId).toBe('string');
      }

      // This user should not have access to sales_person or employee_department_history
      expect(salesPersonDataset).toBeUndefined();
      expect(employeeDeptHistoryDataset).toBeUndefined();
    });

    it('should return datasets in alphabetical order for limited access user', async () => {
      const result = await getPermissionedDatasets(limitedAccessUserId, 0, 100);

      if (result.length > 1) {
        // Check if datasets are sorted alphabetically by name
        for (let i = 1; i < result.length; i++) {
          expect(result[i].name.localeCompare(result[i - 1].name)).toBeGreaterThanOrEqual(0);
        }
      }

      // All datasets should have valid structure
      for (const dataset of result) {
        expect(dataset).toHaveProperty('id');
        expect(dataset).toHaveProperty('name');
        expect(dataset).toHaveProperty('dataSourceId');
        expect(typeof dataset.id).toBe('string');
        expect(typeof dataset.name).toBe('string');
        expect(typeof dataset.dataSourceId).toBe('string');
      }
    });

    it('should handle pagination correctly for limited access user', async () => {
      const page1 = await getPermissionedDatasets(limitedAccessUserId, 0, 10);
      const allResults = await getPermissionedDatasets(limitedAccessUserId, 0, 100);

      expect(Array.isArray(page1)).toBe(true);
      expect(Array.isArray(allResults)).toBe(true);

      // Page 1 should have at most 10 results or all results if fewer than 10
      expect(page1.length).toBeLessThanOrEqual(Math.min(10, allResults.length));

      // If there are results, the first page should contain some of them
      if (allResults.length > 0) {
        expect(page1.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should validate input parameters', async () => {
      // Test invalid UUID
      await expect(getPermissionedDatasets('invalid-uuid', 0, 50)).rejects.toThrow();

      // Test negative page
      await expect(getPermissionedDatasets(testUserId, -1, 50)).rejects.toThrow();

      // Test invalid page size
      await expect(getPermissionedDatasets(testUserId, 0, 0)).rejects.toThrow();
      await expect(getPermissionedDatasets(testUserId, 0, 1001)).rejects.toThrow();
    });
  });
});
