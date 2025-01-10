'use client';

import React, { useRef, useState } from 'react';
import { useDatasetPageContextSelector } from '../_DatasetPageContext';
import { AppSplitter, AppSplitterRef } from '@/components';
import { SQLContainer } from './SQLContainer';
import { DataContainer } from './DataContainer';
import { useMemoizedFn, useRequest } from 'ahooks';
import { BusterDatasetData } from '@/api/busterv2/datasets';
import { timeout } from '@/utils';
import { EditorApps, EditorContainerSubHeader } from './EditorContainerSubHeader';
import { createStyles } from 'antd-style';
import { MetadataContainer } from './MetadataContainer';
import { runSQL } from '@/api/busterv2';
export const EditorContent: React.FC<{
  defaultLayout: [string, string];
}> = ({ defaultLayout }) => {
  const { styles, cx } = useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<AppSplitterRef>(null);
  const [selectedApp, setSelectedApp] = useState<EditorApps>(EditorApps.PREVIEW);
  const datasetData = useDatasetPageContextSelector((state) => state.datasetData);
  const sql = useDatasetPageContextSelector((state) => state.sql);
  const setSQL = useDatasetPageContextSelector((state) => state.setSQL);
  const ymlFile = useDatasetPageContextSelector((state) => state.ymlFile);
  const setYmlFile = useDatasetPageContextSelector((state) => state.setYmlFile);

  const [tempData, setTempData] = useState<BusterDatasetData>(datasetData.data || []);
  const [fetchingTempData, setFetchingTempData] = useState(false);

  const { runAsync: runQuery } = useRequest(
    async () => {
      await timeout(1000);
      const res = await runSQL({ data_source_id: '123', sql });
      console.log(res);
    },
    { manual: true }
  );

  const fetchingData = fetchingTempData || datasetData.isFetching;

  const error = '';

  const onRunQuery = useMemoizedFn(async () => {
    await runQuery();
    const heightOfRow = 36;
    const heightOfDataContainer = heightOfRow * (datasetData.data?.length || 0);
    const containerHeight = ref.current?.clientHeight || 0;
    const maxHeight = Math.floor(containerHeight * 0.6);
    const finalHeight = Math.min(heightOfDataContainer, maxHeight);
    splitterRef.current?.setSplitSizes(['auto', `${finalHeight}px`]);
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
                error={error}
                onRunQuery={onRunQuery}
              />
            }
            rightChildren={
              <DataContainer
                className="mt-3"
                data={datasetData.data!}
                fetchingData={fetchingData}
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