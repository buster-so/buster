import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';

const ListDataSourcesParamsSchema = z.object({
  organizationId: z.string().uuid().describe('Organization ID to filter by'),
  page: z.number().int().min(0).describe('Page number (0-indexed)'),
  pageSize: z.number().int().min(1).max(100).describe('Items per page'),
});

type ListDataSourcesParams = z.infer<typeof ListDataSourcesParamsSchema>;

export interface DataSourceListItem {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
}

export interface ListDataSourcesResult {
  items: DataSourceListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * List data sources for an organization with pagination
 * Filters out soft-deleted sources and orders by updatedAt DESC
 */
export async function listDataSources(
  params: ListDataSourcesParams
): Promise<ListDataSourcesResult> {
  const validated = ListDataSourcesParamsSchema.parse(params);
  const offset = validated.page * validated.pageSize;

  // Build where clause
  const whereClause = and(
    eq(dataSources.organizationId, validated.organizationId),
    isNull(dataSources.deletedAt)
  );

  // Get items and total count in parallel
  const [items, [totalResult]] = await Promise.all([
    db
      .select({
        id: dataSources.id,
        name: dataSources.name,
        type: dataSources.type,
        updatedAt: dataSources.updatedAt,
      })
      .from(dataSources)
      .where(whereClause)
      .orderBy(desc(dataSources.updatedAt))
      .limit(validated.pageSize)
      .offset(offset),
    db.select({ value: count() }).from(dataSources).where(whereClause),
  ]);

  const total = Number(totalResult?.value ?? 0);
  const hasMore = offset + items.length < total;

  return {
    items,
    total,
    page: validated.page,
    pageSize: validated.pageSize,
    hasMore,
  };
}
