import { RunSQLResponse } from '@/api/buster_rest/sql';

export enum SQLResponses {
  '/sql/run:runSql' = '/sql/run:runSql'
}

export type SQLResponses_runSql = {
  route: '/sql/run:runSql';
  callback: (d: RunSQLResponse) => void;
  onError?: (d: unknown) => void;
};

export type SQLResponsesTypes = SQLResponses_runSql;
