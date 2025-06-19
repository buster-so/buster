import type { DataMetadata, IDataResult } from '../metric';
export interface RunSQLResponse {
  data: IDataResult;
  data_metadata: DataMetadata;
}
