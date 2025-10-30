import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, datasets, users } from '../../schema';

const GetDataSourceWithDatasetsParamsSchema = z.object({
  id: z.string().uuid().describe('Data source ID'),
  organizationId: z.string().uuid().describe('Organization ID for access control'),
});

type GetDataSourceWithDatasetsParams = z.infer<typeof GetDataSourceWithDatasetsParamsSchema>;

export interface DatasetSummary {
  id: string;
  name: string;
}

export interface CreatedByInfo {
  id: string;
  email: string;
  name: string;
}

export interface DataSourceWithDatasets {
  id: string;
  name: string;
  type: string;
  organizationId: string;
  secretId: string;
  createdBy: CreatedByInfo;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  onboardingStatus: string;
  onboardingError: string | null;
  datasets: DatasetSummary[];
}

/**
 * Get a data source by ID with creator information and associated datasets
 * Returns null if not found or belongs to different organization
 */
export async function getDataSourceWithDatasets(
  params: GetDataSourceWithDatasetsParams
): Promise<DataSourceWithDatasets | null> {
  const validated = GetDataSourceWithDatasetsParamsSchema.parse(params);

  // Get data source with creator info
  const [dataSourceResult] = await db
    .select({
      id: dataSources.id,
      name: dataSources.name,
      type: dataSources.type,
      organizationId: dataSources.organizationId,
      secretId: dataSources.secretId,
      createdAt: dataSources.createdAt,
      updatedAt: dataSources.updatedAt,
      deletedAt: dataSources.deletedAt,
      onboardingStatus: dataSources.onboardingStatus,
      onboardingError: dataSources.onboardingError,
      createdBy: {
        id: users.id,
        email: users.email,
        name: users.name,
      },
    })
    .from(dataSources)
    .innerJoin(users, eq(dataSources.createdBy, users.id))
    .where(
      and(
        eq(dataSources.id, validated.id),
        eq(dataSources.organizationId, validated.organizationId),
        isNull(dataSources.deletedAt)
      )
    )
    .limit(1);

  if (!dataSourceResult) {
    return null;
  }

  // Get associated datasets
  const datasetResults = await db
    .select({
      id: datasets.id,
      name: datasets.name,
    })
    .from(datasets)
    .where(and(eq(datasets.dataSourceId, validated.id), isNull(datasets.deletedAt)))
    .orderBy(datasets.name);

  return {
    ...dataSourceResult,
    createdBy: {
      id: dataSourceResult.createdBy.id,
      email: dataSourceResult.createdBy.email,
      name: dataSourceResult.createdBy.name ?? '',
    },
    datasets: datasetResults,
  };
}
