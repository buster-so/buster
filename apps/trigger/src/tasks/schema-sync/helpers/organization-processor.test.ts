import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type IntrospectionResult,
  compareSchemaWithYml,
  createIntrospectionService,
  extractColumnsFromYml,
  parseDatasetYml,
} from '@buster/data-source';
import {
  type Dataset,
  type OrganizationWithDataSources,
  getActiveOrganizationsWithDataSources,
  getDatasetsWithYmlContent,
  getDistinctDatabaseSchemas,
  getSecretByName,
} from '@buster/database';
import { processOrganization } from './organization-processor';

// Mock all external dependencies
vi.mock('@buster/database');
vi.mock('@buster/data-source');
vi.mock('@trigger.dev/sdk/v3', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('organization-processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processOrganization with scrap_reason dataset', () => {
    it('should find no discrepancies when YML matches database schema exactly', async () => {
      // Mock organization with data source
      const mockOrg: OrganizationWithDataSources = {
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        dataSources: [
          {
            id: 'ds-adventure-works',
            organizationId: 'org-123',
            name: 'adventure_works',
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            username: 'user',
            schema: null,
            warehouse: null,
            role: null,
            secretId: 'secret-123',
            vaultKey: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
      };

      // Mock the scrap_reason YML content
      const scrapReasonYml = `name: scrap_reason
data_source_name: adventure_works
schema: ont_ont
database: postgres
description: This model helps with quality control analysis, defect categorization, and waste reduction initiatives. It enables manufacturing teams to systematically track and analyze the reasons for scrapped materials and products, providing valuable insights for continuous improvement. The data helps answer critical business questions about the most common causes of product defects, trends in quality issues over time, and opportunities for process improvements to minimize waste and reduce manufacturing costs.
relationships:
- name: work_order
  ref_: null
  expr: scrapreasonid
  type: foreign
  description: Reference to work orders with this scrap reason
  project_path: null
dimensions:
- name: name
  expr: name
  type: character varying
  description: The name of the scrap reason.
  searchable: true
- name: modifieddate
  expr: modifieddate
  type: timestamp without time zone
  description: The date and time when the scrap reason was last modified.
  searchable: false
measures:
- name: scrapreasonid
  expr: scrapreasonid
  agg: sum
  description: The unique identifier for the scrap reason entries.
  type: integer
metrics: []
filters: []`;

      // Mock dataset
      const mockDataset: Dataset = {
        id: 'dataset-123',
        organizationId: 'org-123',
        dataSourceId: 'ds-adventure-works',
        name: 'scrap_reason',
        database: 'postgres',
        schema: 'ont_ont',
        databaseSchema: 'postgres.ont_ont',
        dataSourceName: 'adventure_works',
        ymlFile: scrapReasonYml,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Mock database introspection result matching the actual table
      const mockIntrospectionResult: IntrospectionResult = {
        tables: [
          {
            name: 'scrap_reason',
            columns: [
              { 
                name: 'scrapreasonid', 
                type: 'integer',
                nullable: true,
                isPrimaryKey: false,
                comment: null,
              },
              { 
                name: 'name', 
                type: 'character varying(50)',
                nullable: true,
                isPrimaryKey: false,
                comment: null,
              },
              { 
                name: 'modifieddate', 
                type: 'timestamp without time zone',
                nullable: true,
                isPrimaryKey: false,
                comment: null,
              },
            ],
          },
        ],
        error: undefined,
      };

      // Mock credential retrieval
      vi.mocked(getSecretByName).mockResolvedValue({
        id: 'secret-123',
        name: 'ds-adventure-works',
        description: null,
        secret: JSON.stringify({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          database: 'postgres',
          username: 'user',
          password: 'password',
        }),
        key_id: null,
        nonce: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Mock dataset retrieval
      vi.mocked(getDatasetsWithYmlContent).mockResolvedValue([mockDataset]);

      // Mock dataset grouping
      vi.mocked(getDistinctDatabaseSchemas).mockReturnValue([
        {
          databaseSchema: { database: 'postgres', schema: 'ont_ont' },
          datasets: [mockDataset],
        },
      ]);

      // Mock YML parsing
      vi.mocked(parseDatasetYml).mockReturnValue({
        name: 'scrap_reason',
        description: 'This model helps with quality control analysis...',
        data_source_name: 'adventure_works',
        database: 'postgres',
        schema: 'ont_ont',
        dimensions: [
          {
            name: 'name',
            type: 'character varying',
            description: 'The name of the scrap reason.',
            searchable: true,
          },
          {
            name: 'modifieddate',
            type: 'timestamp without time zone',
            description: 'The date and time when the scrap reason was last modified.',
            searchable: false,
          },
        ],
        measures: [
          {
            name: 'scrapreasonid',
            type: 'integer',
            description: 'The unique identifier for the scrap reason entries.',
          },
        ],
        metrics: [],
        filters: [],
        relationships: [],
      });

      // Mock column extraction
      vi.mocked(extractColumnsFromYml).mockReturnValue([
        { name: 'name', type: 'character varying', source: 'dimension' },
        { name: 'modifieddate', type: 'timestamp without time zone', source: 'dimension' },
        { name: 'scrapreasonid', type: 'integer', source: 'measure' },
      ]);

      // Mock introspection service
      const mockIntrospectionService = {
        introspectDatabaseSchema: vi.fn().mockResolvedValue(mockIntrospectionResult),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(createIntrospectionService).mockReturnValue(mockIntrospectionService as any);

      // Mock schema comparison - no discrepancies
      vi.mocked(compareSchemaWithYml).mockReturnValue([]);

      // Execute the test
      const result = await processOrganization(mockOrg);

      // Assertions
      expect(result.result).toEqual({
        organizationId: 'org-123',
        organizationName: 'Test Organization',
        success: true,
        dataSourcesChecked: 1,
        datasetsChecked: 1,
        discrepancies: 0,
        criticalCount: 0,
        warningCount: 0,
        notificationSent: false,
      });

      expect(result.run.status).toBe('completed');
      expect(result.run.discrepanciesFound).toBe(0);
      expect(result.run.discrepancies).toHaveLength(0);

      // Verify introspection was called with correct params
      expect(mockIntrospectionService.introspectDatabaseSchema).toHaveBeenCalledWith(
        'postgres',
        'ont_ont'
      );

      // Verify comparison was called
      expect(compareSchemaWithYml).toHaveBeenCalledWith(
        mockIntrospectionResult.tables[0].columns,
        [
          { name: 'name', type: 'character varying', source: 'dimension' },
          { name: 'modifieddate', type: 'timestamp without time zone', source: 'dimension' },
          { name: 'scrapreasonid', type: 'integer', source: 'measure' },
        ],
        {
          datasetId: 'dataset-123',
          datasetName: 'scrap_reason',
          tableName: 'scrap_reason',
        }
      );
    });

    it('should detect missing column discrepancy', async () => {
      // Same setup as above but with missing column in introspection result
      const mockOrg: OrganizationWithDataSources = {
        organization: {
          id: 'org-123',
          name: 'Test Organization',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        dataSources: [
          {
            id: 'ds-adventure-works',
            organizationId: 'org-123',
            name: 'adventure_works',
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'postgres',
            username: 'user',
            schema: null,
            warehouse: null,
            role: null,
            secretId: 'secret-123',
            vaultKey: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
      };

      // Mock introspection result with missing 'modifieddate' column
      const mockIntrospectionResult: IntrospectionResult = {
        tables: [
          {
            name: 'scrap_reason',
            columns: [
              { 
                name: 'scrapreasonid', 
                type: 'integer',
                nullable: true,
                isPrimaryKey: false,
                comment: null,
              },
              { 
                name: 'name', 
                type: 'character varying(50)',
                nullable: true,
                isPrimaryKey: false,
                comment: null,
              },
              // modifieddate column is missing!
            ],
          },
        ],
        error: undefined,
      };

      // Set up all the mocks
      vi.mocked(getSecretByName).mockResolvedValue({
        id: 'secret-123',
        name: 'ds-adventure-works',
        description: null,
        secret: JSON.stringify({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          database: 'postgres',
          username: 'user',
          password: 'password',
        }),
        key_id: null,
        nonce: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const mockDataset: Dataset = {
        id: 'dataset-123',
        organizationId: 'org-123',
        dataSourceId: 'ds-adventure-works',
        name: 'scrap_reason',
        database: 'postgres',
        schema: 'ont_ont',
        databaseSchema: 'postgres.ont_ont',
        dataSourceName: 'adventure_works',
        ymlFile: 'name: scrap_reason\n...',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(getDatasetsWithYmlContent).mockResolvedValue([mockDataset]);
      vi.mocked(getDistinctDatabaseSchemas).mockReturnValue([
        {
          databaseSchema: { database: 'postgres', schema: 'ont_ont' },
          datasets: [mockDataset],
        },
      ]);

      vi.mocked(parseDatasetYml).mockReturnValue({
        name: 'scrap_reason',
        description: 'Test description',
        data_source_name: 'adventure_works',
        database: 'postgres',
        schema: 'ont_ont',
        dimensions: [
          { name: 'name', type: 'character varying', searchable: true },
          { name: 'modifieddate', type: 'timestamp without time zone', searchable: false },
        ],
        measures: [{ name: 'scrapreasonid', type: 'integer' }],
        metrics: [],
        filters: [],
        relationships: [],
      });

      vi.mocked(extractColumnsFromYml).mockReturnValue([
        { name: 'name', type: 'character varying', source: 'dimension' },
        { name: 'modifieddate', type: 'timestamp without time zone', source: 'dimension' },
        { name: 'scrapreasonid', type: 'integer', source: 'measure' },
      ]);

      const mockIntrospectionService = {
        introspectDatabaseSchema: vi.fn().mockResolvedValue(mockIntrospectionResult),
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(createIntrospectionService).mockReturnValue(mockIntrospectionService as any);

      // Mock comparison returning a missing column discrepancy
      vi.mocked(compareSchemaWithYml).mockReturnValue([
        {
          type: 'missing_column',
          severity: 'critical',
          datasetId: 'dataset-123',
          datasetName: 'scrap_reason',
          tableName: 'scrap_reason',
          columnName: 'modifieddate',
          message: "Column 'modifieddate' not found in table",
          details: {
            ymlSource: 'dimension',
          },
        },
      ]);

      // Execute the test
      const result = await processOrganization(mockOrg);

      // Assertions
      expect(result.result.success).toBe(true);
      expect(result.result.discrepancies).toBe(1);
      expect(result.result.criticalCount).toBe(1);
      expect(result.result.warningCount).toBe(0);
      expect(result.run.discrepancies).toHaveLength(1);
      expect(result.run.discrepancies[0]).toMatchObject({
        type: 'missing_column',
        severity: 'critical',
        columnName: 'modifieddate',
      });
    });
  });
});