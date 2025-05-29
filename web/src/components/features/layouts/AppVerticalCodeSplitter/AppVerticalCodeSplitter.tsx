import type { IDataResult } from '@/api/asset_interfaces';
import { AppSplitter, type AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { useMount } from '@/hooks';
import React, { forwardRef, MutableRefObject } from 'react';
import { DataContainer } from './DataContainer';
import { SQLContainer } from './SQLContainer';

export interface AppVerticalCodeSplitterProps {
  sql: string;
  setSQL: (sql: string) => void;
  runSQLError: string | undefined;
  onRunQuery: () => Promise<void>;
  data: IDataResult;
  fetchingData: boolean;
  defaultLayout: [string, string];
  autoSaveId: string;
  topHidden?: boolean;
  onSaveSQL?: () => Promise<void>;
  disabledSave?: boolean;
  gapAmount?: number;
  className?: string;
  readOnly?: boolean;
}

export const AppVerticalCodeSplitter = forwardRef<AppSplitterRef, AppVerticalCodeSplitterProps>(
  (
    {
      sql,
      setSQL,
      runSQLError,
      onRunQuery,
      onSaveSQL,
      data,
      readOnly = false,
      fetchingData,
      defaultLayout,
      autoSaveId,
      disabledSave = false,
      topHidden = false,
      gapAmount = 3,
      className
    },
    ref
  ) => {
    //tailwind might not like this, but yolo
    const sqlContainerClassName = !topHidden ? `mb-${gapAmount}` : '';
    const dataContainerClassName = !topHidden ? `mt-${gapAmount}` : '';

    return (
      <AppSplitter
        ref={ref}
        leftChildren={
          <SQLContainer
            className={sqlContainerClassName}
            sql={sql}
            setDatasetSQL={setSQL}
            error={runSQLError}
            onRunQuery={onRunQuery}
            onSaveSQL={onSaveSQL}
            disabledSave={disabledSave}
            readOnly={readOnly}
          />
        }
        rightChildren={
          <DataContainer
            className={dataContainerClassName}
            data={data}
            fetchingData={fetchingData}
          />
        }
        split="horizontal"
        defaultLayout={defaultLayout}
        autoSaveId={autoSaveId}
        preserveSide="left"
        rightPanelMinSize={'80px'}
        leftPanelMinSize={'120px'}
        leftHidden={topHidden}
        className={className}
      />
    );
  }
);

AppVerticalCodeSplitter.displayName = 'AppVerticalCodeSplitter';
