import { and, eq, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, organizations } from '../../schema';

// Type inference from schema
export type Organization = InferSelectModel<typeof organizations>;
export type DataSource = InferSelectModel<typeof dataSources>;

/**
 * Result type for organizations with their data sources
 */
export interface OrganizationWithDataSources {
  organization: Organization;
  dataSources: DataSource[];
}

/**
 * Get all active organizations with their active data sources
 * Used by schema sync cron job to iterate through all organizations
 */
export async function getActiveOrganizationsWithDataSources(): Promise<
  OrganizationWithDataSources[]
> {
  try {
    // First, get all active organizations
    const activeOrganizations = await db
      .select()
      .from(organizations)
      .where(isNull(organizations.deletedAt));

    if (!activeOrganizations.length) {
      return [];
    }

    // Then, get data sources for each organization
    const results: OrganizationWithDataSources[] = [];

    for (const org of activeOrganizations) {
      const orgDataSources = await db
        .select()
        .from(dataSources)
        .where(
          and(
            eq(dataSources.organizationId, org.id),
            isNull(dataSources.deletedAt),
            eq(dataSources.onboardingStatus, 'completed')
          )
        );

      // Only include organizations that have active data sources
      if (orgDataSources.length > 0) {
        results.push({
          organization: org,
          dataSources: orgDataSources,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error fetching active organizations with data sources:', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}
