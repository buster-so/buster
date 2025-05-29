'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import type React from 'react';
import { type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useDeployDataset, useIndividualDataset } from '@/api/buster_rest';
import { useDebounce, useMemoizedFn } from '@/hooks';
import type { DatasetApps } from './config';

export const useDatasetPageContext = ({ datasetId }: { datasetId: string }) => {
  const segments = useSelectedLayoutSegment() as DatasetApps;
  const { mutate: onUpdateDataset, isPending: isDeployingDataset } = useDeployDataset();
  const { dataset, datasetData } = useIndividualDataset({ datasetId });
  const originalDatasetSQL = dataset?.data?.sql;
  const datasetYmlFile = dataset?.data?.yml_file;

  const [sql, setSQL] = useState<string>(originalDatasetSQL || '');
  const [ymlFile, setYmlFile] = useState<string>(datasetYmlFile || '');

  const datasetSQL = dataset?.data?.sql;

  const disablePublish = useMemo(() => {
    const originalSQL = datasetSQL || '';
    const originalYmlFile = datasetYmlFile || '';
    return !datasetId || !sql || !ymlFile || (originalYmlFile === ymlFile && originalSQL === sql);
  }, [datasetSQL, sql, datasetId, datasetYmlFile, ymlFile]);

  const isChangedSQL = useMemo(() => {
    return originalDatasetSQL !== sql;
  }, [originalDatasetSQL, sql]);

  const resetDataset = useMemoizedFn(() => {
    setSQL(originalDatasetSQL || '');
    setYmlFile(datasetYmlFile || '');
  });

  const onPublishDataset = useMemoizedFn(async () => {
    if (disablePublish || !sql || !ymlFile) return;
    onUpdateDataset({
      dataset_id: datasetId,
      sql: sql,
      yml: ymlFile
    });
  });

  const selectedApp = useDebounce(segments, { wait: 25 });

  useEffect(() => {
    setSQL(originalDatasetSQL || '');
  }, [originalDatasetSQL]);

  useEffect(() => {
    setYmlFile(datasetYmlFile || '');
  }, [datasetYmlFile]);

  return {
    onPublishDataset,
    sql,
    ymlFile,
    resetDataset,
    selectedApp,
    setSQL,
    setYmlFile,
    datasetData,
    dataset,
    disablePublish,
    isChangedSQL,
    datasetId,
    isDeployingDataset
  };
};

const DatasetPageContext = createContext<ReturnType<typeof useDatasetPageContext>>(
  {} as ReturnType<typeof useDatasetPageContext>
);

export const DatasetPageProvider: React.FC<
  PropsWithChildren<{
    datasetId: string;
  }>
> = ({ children, datasetId }) => {
  const datasetPageContext = useDatasetPageContext({ datasetId });

  return (
    <DatasetPageContext.Provider value={datasetPageContext}>{children}</DatasetPageContext.Provider>
  );
};

export const useDatasetPageContextSelector = <T,>(
  selector: (value: ReturnType<typeof useDatasetPageContext>) => T
) => useContextSelector(DatasetPageContext, selector);
