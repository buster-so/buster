import type { DataResult } from '@buster/server-shared/metrics';
import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { useGetDatasetData } from '@/api/buster_rest/datasets';
import { useRunSQL } from '@/api/buster_rest/sql';
import type { AppSplitterRef, LayoutSize } from '@/components/ui/layouts/AppSplitter';
import {
  AppVerticalCodeSplitter,
  type AppVerticalCodeSplitterProps,
} from '@/components/ui/layouts/AppVerticalCodeSplitter';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useRequest } from '@/hooks/useRequest';
import { cn } from '@/lib/classMerge';
import {
  useGetDatasetPageDataset,
  useGetDatasetPageDatasetData,
  useGetDatasetPageSQLAndYaml,
} from '../DatasetsIndividualLayout/DatasetPageContext';
import { EditorApps, EditorContainerSubHeader } from './EditorContainerSubHeader';
import { MetadataContainer } from './MetadataContainer';

export const DatasetEditorController: React.FC<{
  defaultLayout: LayoutSize;
  initialLayout: LayoutSize | null;
  datasetId: string;
  autoSaveId: string;
}> = ({ defaultLayout, initialLayout, autoSaveId }) => {
  const ref = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<AppSplitterRef>(null);
  const [selectedApp, setSelectedApp] = useState<EditorApps>(EditorApps.PREVIEW);
  const { data: datasetData = [], isFetching: fetchingInitialData } =
    useGetDatasetPageDatasetData();
  const { data: dataset } = useGetDatasetPageDataset();
  const { sql, setSQL, ymlFile, setYmlFile } = useGetDatasetPageSQLAndYaml();
  // const sql = useDatasetPageContextSelector((state) => state.sql);
  // const setSQL = useDatasetPageContextSelector((state) => state.setSQL);
  // const ymlFile = useDatasetPageContextSelector((state) => state.ymlFile);
  // const setYmlFile = useDatasetPageContextSelector((state) => state.setYmlFile);
  const { mutateAsync: runSQLMutation, error: runSQLError } = useRunSQL();

  const [tempData, setTempData] = useState<DataResult>(datasetData);

  const shownData = useMemo(() => {
    return isEmpty(tempData) ? datasetData : tempData;
  }, [tempData, datasetData]);

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

  const runButton: AppVerticalCodeSplitterProps['runButton'] = useMemo(() => {
    return {
      label: 'Run',
      onClick: onRunQuery,
      loading: fetchingTempData,
      disabled: false,
    };
  }, [onRunQuery, fetchingTempData]);

  const saveButton: AppVerticalCodeSplitterProps['saveButton'] = useMemo(() => {
    return {
      label: 'Save',
      onClick: onRunQuery,
      loading: fetchingInitialData,
      disabled: false,
    };
  }, [onRunQuery, fetchingInitialData]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" ref={ref}>
      <EditorContainerSubHeader selectedApp={selectedApp} setSelectedApp={setSelectedApp} />
      <div className={cn('bg-page-background h-full w-full overflow-hidden p-5')}>
        {selectedApp === EditorApps.PREVIEW && (
          <AppVerticalCodeSplitter
            autoSaveId={autoSaveId}
            ref={splitterRef}
            sql={sql}
            setSQL={setSQL}
            runSQLError={runSQLError?.message}
            runButton={runButton}
            saveButton={saveButton}
            data={shownData}
            fetchingData={fetchingInitialData || fetchingTempData}
            defaultLayout={defaultLayout}
            readOnly={true}
            initialLayout={initialLayout}
          />
        )}

        {selectedApp === EditorApps.METADATA && (
          <MetadataContainer ymlFile={ymlFile} setYmlFile={setYmlFile} readOnly={true} />
        )}
      </div>
    </div>
  );
};
