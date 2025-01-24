import { BusterSocketRequestBase } from '../baseInterfaces';

export type SQLRunEmit = BusterSocketRequestBase<
  '/sql/run',
  | {
      dataset_id: string;
      sql: string;
    }
  | {
      data_source_id: string;
      sql: string;
    }
>;

export type SQLEmits = SQLRunEmit;
