import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, datasets, users } from '../../schema';
import { PaginationInputSchema } from '../../schema-types';
import { getPermissionedDatasets } from '../dataset-permissions/get-permissioned-datasets';

/**
 * Parameters for listing datasets
 */
const ListDatasetsParamsSchema = z
  .object({
    organizationId: z.string().uuid(),
    enabled: z.boolean().optional(),
    imported: z.boolean().optional(),
    dataSourceId: z.string().uuid().optional(),
  })
  .merge(PaginationInputSchema);

type ListDatasetsParams = z.infer<typeof ListDatasetsParamsSchema>;

/**
 * Result type for list datasets
 */
export interface ListDatasetResult {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  imported: boolean;
  userId: string;
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
  dataSourceId: string;
  dataSourceName: string;
}

/**
 * List all datasets for an organization with optional filters
 * This is used for admin users (WorkspaceAdmin, DataAdmin, Querier)
 */
export async function listOrganizationDatasets(
  params: ListDatasetsParams
): Promise<ListDatasetResult[]> {
  const validated = ListDatasetsParamsSchema.parse(params);
  const offset = (validated.page - 1) * validated.page_size;
  const limit = validated.page_size;

  const conditions = [
    eq(datasets.organizationId, validated.organizationId),
    isNull(datasets.deletedAt),
  ];

  // Filter by enabled status (default to only enabled datasets)
  if (validated.enabled !== undefined) {
    conditions.push(eq(datasets.enabled, validated.enabled));
  } else {
    conditions.push(eq(datasets.enabled, true));
  }

  // Filter by data source if provided
  if (validated.dataSourceId) {
    conditions.push(eq(datasets.dataSourceId, validated.dataSourceId));
  }

  // Filter by imported status if provided
  if (validated.imported !== undefined) {
    conditions.push(eq(datasets.imported, validated.imported));
  }

  const results = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      createdAt: datasets.createdAt,
      updatedAt: datasets.updatedAt,
      enabled: datasets.enabled,
      imported: datasets.imported,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userAvatarUrl: users.avatarUrl,
      dataSourceId: dataSources.id,
      dataSourceName: dataSources.name,
    })
    .from(datasets)
    .innerJoin(dataSources, eq(datasets.dataSourceId, dataSources.id))
    .innerJoin(users, eq(datasets.createdBy, users.id))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(datasets.name);

  return results;
}

/**
 * List datasets that a restricted user has access to via permissions
 * This uses the dataset-permissions query to get permissioned datasets
 */
export async function listPermissionedDatasets(
  userId: string,
  page: number = 0,
  pageSize: number = 25
): Promise<ListDatasetResult[]> {
  // Get the permissioned dataset Ids
  const permissionedDatasetsResponse = await getPermissionedDatasets({
    userId,
    page,
    pageSize,
  });

  if (permissionedDatasetsResponse.datasets.length === 0) {
    return [];
  }

  // Get the dataset IDs
  const datasetIds = permissionedDatasetsResponse.datasets.map((d) => d.id);

  // Fetch full dataset details with data source info
  const results = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      createdAt: datasets.createdAt,
      updatedAt: datasets.updatedAt,
      enabled: datasets.enabled,
      imported: datasets.imported,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userAvatarUrl: users.avatarUrl,
      dataSourceId: dataSources.id,
      dataSourceName: dataSources.name,
    })
    .from(datasets)
    .innerJoin(dataSources, eq(datasets.dataSourceId, dataSources.id))
    .innerJoin(users, eq(datasets.createdBy, users.id))
    .where(
      and(inArray(datasets.id, datasetIds), eq(datasets.enabled, true), isNull(datasets.deletedAt))
    );

  return results;
}
