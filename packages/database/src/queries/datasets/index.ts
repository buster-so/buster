export { getDataSourceWithDetails } from './get-data-source-with-details';
export type {
  GetDataSourceWithDetailsInput,
  GetDataSourceWithDetailsOutput,
} from './get-data-source-with-details';

export { upsertDataset } from './upsert-dataset';
export type { UpsertDatasetInput } from './upsert-dataset';

export { updateDatasetMetadata } from './update-dataset-metadata';
export type { UpdateDatasetMetadataInput } from './update-dataset-metadata';

// Re-export metadata types for convenience
export type { DatasetMetadata, DatasetColumnProfile } from '../../types/dataset-metadata';
