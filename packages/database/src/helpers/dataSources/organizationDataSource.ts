import { z } from 'zod';
import { db } from '../../connection';
import { dataSources } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';

// Zod schemas for validation
export const OrganizationDataSourceInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
});

export const OrganizationDataSourceOutputSchema = z.object({
  dataSourceId: z.string(),
  dataSourceSyntax: z.string(),
});

export type OrganizationDataSourceInput = z.infer<typeof OrganizationDataSourceInputSchema>;
export type OrganizationDataSourceOutput = z.infer<typeof OrganizationDataSourceOutputSchema>;

/**
 * Get organization's data source with validation
 * Validates single data source constraint and prepares for future selection
 */
export async function getOrganizationDataSource(input: OrganizationDataSourceInput): Promise<OrganizationDataSourceOutput> {
  try {
    // Validate input
    const validatedInput = OrganizationDataSourceInputSchema.parse(input);
    
    // Database query with error handling
    let orgDataSources: Array<{
      id: string;
      type: string;
    }>;
    try {
      orgDataSources = await db
        .select({
          id: dataSources.id,
          type: dataSources.type,
        })
        .from(dataSources)
        .where(
          and(
            eq(dataSources.organizationId, validatedInput.organizationId),
            isNull(dataSources.deletedAt)
          )
        );
    } catch (dbError) {
      throw new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
    }

    if (orgDataSources.length === 0) {
      throw new Error('No data sources found for organization');
    }

    if (orgDataSources.length > 1) {
      throw new Error('Multiple data sources found for organization. Data source selection is not available yet - please contact support if you need to work with multiple data sources.');
    }

    const dataSource = orgDataSources[0];
    if (!dataSource) {
      throw new Error('Unexpected error: data source not found after validation');
    }
    
    const output = {
      dataSourceId: dataSource.id,
      dataSourceSyntax: dataSource.type,
    };

    // Validate output with error handling
    try {
      return OrganizationDataSourceOutputSchema.parse(output);
    } catch (validationError) {
      throw new Error(`Output validation failed: ${validationError instanceof Error ? validationError.message : 'Invalid output format'}`);
    }
  } catch (error) {
    // Handle Zod input validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    // Re-throw other errors with context
    throw error instanceof Error ? error : new Error(`Failed to get organization data source: ${String(error)}`);
  }
}