import { forwardRef } from 'react';
import type { DataResult } from '@buster/server-shared/metrics';
import { AppSplitter, type AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { DataContainer } from './DataContainer';
import { DiffSQLContainer } from './DiffSQLContainer';

const DEFAULT_LAYOUT = ['auto', '300px'];

export interface AppVerticalDiffCodeSplitterProps {
  originalValue: string;
  value: string;
  setValue: (value: string) => void;
  language: 'sql' | 'yaml';
  runSQLError: string | undefined;
  onRunQuery: () => Promise<void>;
  data: DataResult;
  fetchingData: boolean;
  defaultLayout?: [string, string];
  autoSaveId: string;
  topHidden?: boolean;
  onSaveSQL?: () => Promise<void>;
  disabledSave?: boolean;
  gapAmount?: number;
  className?: string;
  fileName?: string;
  versionNumber?: number;
}

export const AppVerticalDiffCodeSplitter = forwardRef<
  AppSplitterRef,
  AppVerticalDiffCodeSplitterProps
>(
  (
    {
      originalValue,
      value,
      setValue,
      language,
      runSQLError,
      onRunQuery,
      onSaveSQL,
      data,
      fetchingData,
      defaultLayout = DEFAULT_LAYOUT,
      autoSaveId,
      fileName,
      versionNumber,
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
          <DiffSQLContainer
            className={sqlContainerClassName}
            originalValue={originalValue}
            value={value}
            setValue={setValue}
            language={language}
            error={runSQLError}
            onRunQuery={onRunQuery}
            onSaveSQL={onSaveSQL}
            disabledSave={disabledSave}
            fileName={fileName}
            versionNumber={versionNumber}
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

AppVerticalDiffCodeSplitter.displayName = 'AppVerticalDiffCodeSplitter';
