import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, datasets, usersToOrganizations } from '../../schema';
import { DataSourceType } from '../vault/credentials/types';

/**
 * Parameters for getting a dataset with data source
 */
const GetDatasetWithDataSourceParamsSchema = z.object({
  datasetId: z.string().uuid(),
  userId: z.string().uuid(),
});

type GetDatasetWithDataSourceParams = z.infer<typeof GetDatasetWithDataSourceParamsSchema>;

/**
 * Result type for get dataset with data source
 */
export interface GetDatasetWithDataSourceResult {
  id: string;
  name: string;
  sql: string;
  whenToUse: string | null;
  ymlFile: string | null;
  dataSourceName: string;
  dataSourceType: DataSourceType;
  dataSourceId: string;
}

/**
 * Get a dataset by ID with data source information
 * Checks that the user has admin access to the dataset
 */
export async function getDatasetWithDataSource(
  params: GetDatasetWithDataSourceParams
): Promise<GetDatasetWithDataSourceResult | null> {
  const validated = GetDatasetWithDataSourceParamsSchema.parse(params);

  // First check if user has admin access through their organization role
  const userRole = await db
    .select({
      role: usersToOrganizations.role,
    })
    .from(usersToOrganizations)
    .innerJoin(datasets, eq(usersToOrganizations.organizationId, datasets.organizationId))
    .where(
      and(
        eq(datasets.id, validated.datasetId),
        eq(usersToOrganizations.userId, validated.userId),
        isNull(usersToOrganizations.deletedAt)
      )
    )
    .limit(1);

  if (!userRole.length || !userRole[0]) {
    throw new Error('Unable to get user role');
  }

  const role = userRole[0].role;
  const hasAdminAccess = role === 'workspace_admin' || role === 'data_admin';

  if (!hasAdminAccess) {
    throw new Error('User does not have permission to access this dataset');
  }

  // Get dataset with data source info
  const result = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      sql: datasets.definition,
      whenToUse: datasets.whenToUse,
      ymlFile: datasets.ymlFile,
      dataSourceName: dataSources.name,
      dataSourceType: dataSources.type,
      dataSourceId: dataSources.id,
    })
    .from(datasets)
    .innerJoin(dataSources, eq(datasets.dataSourceId, dataSources.id))
    .where(and(eq(datasets.id, validated.datasetId), isNull(datasets.deletedAt)))
    .limit(1);

  if (!result.length || !result[0]) {
    return null;
  }

  return result[0];
}
