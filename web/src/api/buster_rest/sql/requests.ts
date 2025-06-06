import type { RunSQLResponse } from '../../asset_interfaces/sql';
import { mainApi } from '../instances';

export const runSQL = async (params: { data_source_id: string; sql: string }) => {
  return mainApi.post<RunSQLResponse>('/sql/run', params).then((res) => res.data);
};
