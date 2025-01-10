'use client';

import { useIndividualDataset } from '@/context/Datasets';
import { useSelectedLayoutSegment } from 'next/navigation';
import React, { PropsWithChildren, useLayoutEffect, useState } from 'react';
import { DatasetApps } from './_config';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';

export const useDatasetPageContext = ({ datasetId }: { datasetId: string }) => {
  const segments = useSelectedLayoutSegment() as DatasetApps;
  const datasetResult = useIndividualDataset({ datasetId });
  const datasetSQL = datasetResult.dataset.data?.sql;
  const [sql, setSQL] = useState<string>(datasetSQL ?? '');

  const selectedApp = segments;

  useLayoutEffect(() => {
    setSQL(datasetSQL ?? '');
  }, [datasetSQL]);

  return { sql, selectedApp, setSQL, ...datasetResult };
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
  selector: ContextSelector<ReturnType<typeof useDatasetPageContext>, T>
) => useContextSelector(DatasetPageContext, selector);
