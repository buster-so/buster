import { mainApi } from '../instances';
import { RunSQLResponse } from './responseInterfaces';

export const runSQL = (params: { data_source_id: string; sql: string }) => {
  return mainApi.post<RunSQLResponse>('/sql/run', params);
};
