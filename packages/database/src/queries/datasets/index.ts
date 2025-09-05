// Export all dataset-related database queries
// From staging (deploy functionality)
export { deployDatasetsBatch, type BatchDeployResult } from './deploy-batch';
export { softDeleteDatasetsNotIn, getOrganizationDatasets } from './soft-delete-datasets';
export { getDataSourceByName, userHasDataSourceAccess } from './get-data-source';

// From HEAD (metadata functionality)
export { getDataSourceWithDetails } from './get-data-source-with-details';
export type {
  GetDataSourceWithDetailsInput,
  GetDataSourceWithDetailsOutput,
} from './get-data-source-with-details';
export { updateDatasetMetadata } from './update-dataset-metadata';
export type { UpdateDatasetMetadataInput } from './update-dataset-metadata';

// Common
export { upsertDataset } from './upsert-dataset';
export type { UpsertDatasetInput } from './upsert-dataset';

// Re-export metadata types for convenience
export type { DatasetMetadata, DatasetColumnProfile } from '../../types/dataset-metadata';
