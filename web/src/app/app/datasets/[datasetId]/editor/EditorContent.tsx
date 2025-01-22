'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useDatasetPageContextSelector } from '../_DatasetPageContext';
import { AppSplitter, AppSplitterRef } from '@/components';
import { SQLContainer } from './SQLContainer';
import { DataContainer } from './DataContainer';
import { useMemoizedFn, useRequest } from 'ahooks';
import { BusterDatasetData } from '@/api/buster_rest/datasets';
import { timeout } from '@/utils';
import { EditorApps, EditorContainerSubHeader } from './EditorContainerSubHeader';
import { createStyles } from 'antd-style';
import { MetadataContainer } from './MetadataContainer';
import { runSQL } from '@/api/buster_rest';
import { RustApiError } from '@/api/buster_rest/errors';
import isEmpty from 'lodash/isEmpty';

export const EditorContent: React.FC<{
  defaultLayout: [string, string];
}> = ({ defaultLayout }) => {
  const { styles, cx } = useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<AppSplitterRef>(null);
  const [selectedApp, setSelectedApp] = useState<EditorApps>(EditorApps.PREVIEW);
  const datasetData = useDatasetPageContextSelector((state) => state.datasetData);
  const { data: dataset } = useDatasetPageContextSelector((state) => state.dataset);
  const sql = useDatasetPageContextSelector((state) => state.sql);
  const setSQL = useDatasetPageContextSelector((state) => state.setSQL);
  const ymlFile = useDatasetPageContextSelector((state) => state.ymlFile);
  const setYmlFile = useDatasetPageContextSelector((state) => state.setYmlFile);

  const [tempData, setTempData] = useState<BusterDatasetData>(datasetData.data || []);
  const [runSQLError, setRunSQLError] = useState<string>('');

  const shownData = useMemo(() => {
    return isEmpty(tempData) ? datasetData.data || [] : tempData;
  }, [tempData, datasetData.data]);

  const { runAsync: runQuery, loading: fetchingTempData } = useRequest(
    async () => {
      try {
        setRunSQLError('');
        const res = await runSQL({ data_source_id: dataset?.data_source_id!, sql });
        const data = res.data.data;
        setTempData(data);
        return data;
      } catch (error) {
        setRunSQLError((error as unknown as RustApiError)?.message || 'Something went wrong');
      }
    },
    { manual: true }
  );

  const fetchingInitialData = datasetData.isFetching;

  const onRunQuery = useMemoizedFn(async () => {
    try {
      const result = await runQuery();
      if (result && result.length > 0) {
        const headerHeight = 50;
        const heightOfRow = 36;
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
      <div className={cx('h-full w-full overflow-hidden p-5', styles.container)}>
        {selectedApp === EditorApps.PREVIEW && (
          <AppSplitter
            ref={splitterRef}
            leftChildren={
              <SQLContainer
                className="mb-3"
                datasetSQL={sql}
                setDatasetSQL={setSQL}
                error={runSQLError}
                onRunQuery={onRunQuery}
              />
            }
            rightChildren={
              <DataContainer
                className="mt-3"
                data={shownData}
                fetchingData={fetchingInitialData || fetchingTempData}
              />
            }
            split="horizontal"
            defaultLayout={defaultLayout}
            autoSaveId="dataset-editor"
            preserveSide="left"
            rightPanelMinSize={'80px'}
            leftPanelMinSize={'120px'}
          />
        )}

        {selectedApp === EditorApps.METADATA && (
          <MetadataContainer ymlFile={ymlFile} setYmlFile={setYmlFile} />
        )}
      </div>
    </div>
  );
};

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    background: ${token.controlItemBgHover};
  `
}));
