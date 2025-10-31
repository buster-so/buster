import { db } from '@buster/database/connection';
import { dataSources } from '@buster/database/schema';
import type { DataSourceTypeValue } from '@buster/database/schema-types';
import { v4 as uuidv4 } from 'uuid';
import { createTestOrganization } from '../organizations/createTestOrganization';
import { createTestUser } from '../users/createTestUser';

/**
 * Creates a test data source record in the database
 * @param params - Optional parameters to override defaults
 * @returns An object containing the data source info
 */
export async function createTestDataSource(params?: {
  organizationId?: string;
  createdBy?: string;
  name?: string;
  type?: DataSourceTypeValue;
}): Promise<{
  dataSourceId: string;
  organizationId: string;
  userId: string;
  dataSourceType: string;
}> {
  try {
    const dataSourceId = uuidv4();

    // Create organization and user if not provided
    const organizationId = params?.organizationId || (await createTestOrganization());
    const userId = params?.createdBy || (await createTestUser());
    const secretId = uuidv4();
    const dataSourceType = params?.type || 'postgres';
    const name = params?.name || `Test Data Source ${uuidv4()}`;

    await db.insert(dataSources).values({
      id: dataSourceId,
      name,
      type: dataSourceType,
      secretId,
      organizationId,
      createdBy: userId,
      updatedBy: userId,
      onboardingStatus: 'completed',
    });

    return {
      dataSourceId,
      organizationId,
      userId,
      dataSourceType,
    };
  } catch (error) {
    throw new Error(
      `Failed to create test data source: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
