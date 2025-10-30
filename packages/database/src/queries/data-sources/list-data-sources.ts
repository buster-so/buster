import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';
import type { PaginatedResponse } from '../../schema-types';
import { createPaginatedResponse } from '../../schema-types';

const ListDataSourcesParamsSchema = z.object({
  organizationId: z.string().uuid().describe('Organization ID to filter by'),
  page: z.number().int().min(1).describe('Page number (1-indexed)'),
  page_size: z.number().int().min(1).max(100).describe('Items per page'),
});

type ListDataSourcesParams = z.infer<typeof ListDataSourcesParamsSchema>;

export interface DataSourceListItem {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
}

export type ListDataSourcesResult = PaginatedResponse<DataSourceListItem>;

/**
 * List data sources for an organization with pagination
 * Filters out soft-deleted sources and orders by updatedAt DESC
 */
export async function listDataSources(
  params: ListDataSourcesParams
): Promise<ListDataSourcesResult> {
  const validated = ListDataSourcesParamsSchema.parse(params);
  const offset = (validated.page - 1) * validated.page_size;

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
      .limit(validated.page_size)
      .offset(offset),
    db.select({ value: count() }).from(dataSources).where(whereClause),
  ]);

  const total = Number(totalResult?.value ?? 0);

  return createPaginatedResponse({
    data: items,
    page: validated.page,
    page_size: validated.page_size,
    total,
  });
}
