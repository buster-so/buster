'use client';

import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import type { IDataResult } from '@/api/asset_interfaces';
import { useRunSQL } from '@/api/buster_rest';
import { AppVerticalCodeSplitter } from '@/components/features/layouts/AppVerticalCodeSplitter';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { useMemoizedFn, useRequest } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { useDatasetPageContextSelector } from '../_DatasetsLayout/DatasetPageContext';
import { EditorApps, EditorContainerSubHeader } from './EditorContainerSubHeader';
import { MetadataContainer } from './MetadataContainer';

export const EditorContent: React.FC<{
  defaultLayout: [string, string];
}> = ({ defaultLayout }) => {
  const ref = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<AppSplitterRef>(null);
  const [selectedApp, setSelectedApp] = useState<EditorApps>(EditorApps.PREVIEW);
  const datasetData = useDatasetPageContextSelector((state) => state.datasetData);
  const { data: dataset } = useDatasetPageContextSelector((state) => state.dataset);
  const sql = useDatasetPageContextSelector((state) => state.sql);
  const setSQL = useDatasetPageContextSelector((state) => state.setSQL);
  const ymlFile = useDatasetPageContextSelector((state) => state.ymlFile);
  const setYmlFile = useDatasetPageContextSelector((state) => state.setYmlFile);
  const { mutateAsync: runSQLMutation, error: runSQLError } = useRunSQL();

  const [tempData, setTempData] = useState<IDataResult>(datasetData.data || []);

  const shownData = useMemo(() => {
    return isEmpty(tempData) ? datasetData.data || [] : tempData;
  }, [tempData, datasetData.data]);

  const { runAsync: runQuery, loading: fetchingTempData } = useRequest(
    async () => {
      if (dataset?.data_source_id) {
        const res = await runSQLMutation({ data_source_id: dataset.data_source_id, sql });
        const data = res.data;
        setTempData(data);
        return data;
      }
      return [];
    },
    { manual: true }
  );

  const fetchingInitialData = datasetData.isFetching;

  const onRunQuery = useMemoizedFn(async () => {
    try {
      const result = await runQuery();
      if (result && result.length > 0) {
        const headerHeight = 30;
        const heightOfRow = 28;
        const heightOfDataContainer = headerHeight + heightOfRow * (result.length || 0);
        const containerHeight = ref.current?.clientHeight || 0;
        const maxHeight = Math.floor(containerHeight * 0.6);
        const finalHeight = Math.min(heightOfDataContainer, maxHeight);
        splitterRef.current?.setSplitSizes(['auto', `${finalHeight}px`]);
      }
    } catch (error) {
      //
    }
  });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" ref={ref}>
      <EditorContainerSubHeader selectedApp={selectedApp} setSelectedApp={setSelectedApp} />
      <div className={cn('bg-page-background h-full w-full overflow-hidden p-5')}>
        {selectedApp === EditorApps.PREVIEW && (
          <AppVerticalCodeSplitter
            autoSaveId="dataset-editor"
            ref={splitterRef}
            sql={sql}
            setSQL={setSQL}
            runSQLError={runSQLError?.message}
            onRunQuery={onRunQuery}
            data={shownData}
            fetchingData={fetchingInitialData || fetchingTempData}
            defaultLayout={defaultLayout}
            readOnly={true}
          />
        )}

        {selectedApp === EditorApps.METADATA && (
          <MetadataContainer ymlFile={ymlFile} setYmlFile={setYmlFile} readOnly={true} />
        )}
      </div>
    </div>
  );
};
