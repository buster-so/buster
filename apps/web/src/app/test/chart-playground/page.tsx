'use client';

import { useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { DynamicAppCodeEditor as AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor/DynamicAppCodeEditor';
import { yamlToJson } from '@/lib/yaml-to-json';
import { useRunSQL } from '@/api/buster_rest/sql/queryRequests';
import { BusterChartDynamic } from '@/components/ui/charts/BusterChartDynamic';
import {
  ChartConfigPropsSchema,
  type ChartConfigProps,
  type DataResult
} from '@buster/server-shared/metrics';
import type { ZodError } from 'zod';
import type { RunSQLResponse } from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { AppSplitter } from '@/components/ui/layouts/AppSplitter';

type YamlifiedConfig = {
  sql: string;
  chartConfig: ChartConfigProps;
};

const initfile = `name: Top 10 Customers by Lifetime Value\ndescription: Shows the customers who have generated the highest total revenue over their entire relationship with the company\ntimeFrame: All time\nsql: \"SELECT \\n  CONCAT(p.firstname, ' ', p.lastname) AS customer_name,\\n  clv.metric_clv_all_time::numeric AS lifetime_value\\nFROM postgres.ont_ont.customer_all_time_clv clv\\nJOIN postgres.ont_ont.customer c ON clv.customerid = c.customerid\\nLEFT JOIN postgres.ont_ont.person p ON c.personid = p.businessentityid\\nWHERE p.firstname IS NOT NULL AND p.lastname IS NOT NULL\\nORDER BY clv.metric_clv_all_time::numeric DESC\\nLIMIT 10\\n\"\nchartConfig:\n  selectedChartType: bar\n  columnLabelFormats:\n    customer_name:\n      columnType: string\n      style: string\n      numberSeparatorStyle: null\n      replaceMissingDataWith: null\n    lifetime_value:\n      columnType: number\n      style: currency\n      numberSeparatorStyle: ','\n      minimumFractionDigits: 2\n      maximumFractionDigits: 2\n      replaceMissingDataWith: 0\n      currency: USD\n  barAndLineAxis:\n    x:\n    - customer_name\n    y:\n    - lifetime_value\n  barLayout: horizontal\n`;
const initDataSourceId = 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a';

export default function ChartPlayground() {
  // State management
  const [config, setConfig] = useState<string>(initfile);
  const [dataResponse, setDataResponse] = useState<RunSQLResponse | null>(null);
  const [dataSourceId, setDataSourceId] = useState<string>(initDataSourceId);

  // SQL mutation hook
  const {
    mutateAsync: runSQLMutation,
    error: runSQLError,
    isPending: isRunningSQL,
    isSuccess: hasRunSQL,
    reset: resetRunSQL
  } = useRunSQL();

  // Parse YAML config
  const yamlifiedConfig = useMemo(() => {
    if (!config.trim()) return null;
    try {
      return yamlToJson<YamlifiedConfig>(config);
    } catch (error) {
      return null;
    }
  }, [config]);

  // Parse and validate chart configuration
  const chartConfigParsed = useMemo(() => {
    if (!yamlifiedConfig?.chartConfig) {
      return { data: null, error: null };
    }

    const parsed = ChartConfigPropsSchema.safeParse(yamlifiedConfig.chartConfig);
    return {
      data: parsed.success ? parsed.data : null,
      error: parsed.success ? null : (parsed.error as ZodError)
    };
  }, [yamlifiedConfig]);

  // Derived values
  const chartConfig = chartConfigParsed.data;
  const chartConfigError = chartConfigParsed.error;
  const data: DataResult = dataResponse?.data || [];
  const columnMetadata = dataResponse?.data_metadata?.column_metadata || [];
  const hasSQL = !!yamlifiedConfig?.sql;
  const hasDataSourceId = !!dataSourceId.trim();

  // SQL execution handler
  const runSQL = useMemoizedFn(async () => {
    if (!yamlifiedConfig?.sql || !hasDataSourceId) {
      return;
    }

    try {
      const res = await runSQLMutation({
        sql: yamlifiedConfig.sql,
        data_source_id: dataSourceId
      });
      setDataResponse(res);
    } catch (error) {
      // Error is handled by the hook
    }
  });

  // Status checks
  const isReadyToRun = hasSQL && hasDataSourceId;
  const isReadyToChart = chartConfig && data.length > 0 && hasRunSQL;

  // Setup hotkey for running SQL (meta+enter)
  useHotkeys(
    'meta+enter',
    (event) => {
      event.preventDefault();
      if (isReadyToRun && !isRunningSQL) {
        runSQL();
      }
    },
    {
      enabled: isReadyToRun && !isRunningSQL,
      enableOnContentEditable: true,
      enableOnFormTags: true
    }
  );

  // Define the left panel content (code editor and controls)
  const leftPanelContent = (
    <div className="bg-background flex h-full w-full flex-col space-y-4 overflow-hidden rounded-lg border p-4">
      <div className="h-full w-full overflow-hidden">
        <AppCodeEditor value={config} onChange={setConfig} />
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-1">
          <label className="w-fit min-w-28 text-sm font-medium">Data Source ID</label>
          <Input value={dataSourceId || ''} onChange={(e) => setDataSourceId(e.target.value)} />
        </div>
        <Button block onClick={runSQL} loading={isRunningSQL} disabled={!hasSQL}>
          <div className="flex items-center justify-center gap-2">
            <span>Run SQL</span>
            <span className="rounded bg-black/10 px-1.5 py-0.5 text-xs opacity-70">⌘↵</span>
          </div>
        </Button>
      </div>
    </div>
  );

  // Define the right panel content (chart preview)
  const rightPanelContent = (
    <div className="bg-background flex h-full flex-col overflow-hidden rounded-lg border shadow-sm">
      {/* Header */}
      <div className="bg-muted/30 border-b px-6 py-4">
        <h3 className="text-foreground text-lg font-semibold">Chart Preview</h3>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Error States */}
        {chartConfigError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="mb-3 flex items-center space-x-2">
              <div className="h-4 w-4 flex-shrink-0 rounded-full bg-red-400"></div>
              <h4 className="text-sm font-semibold text-red-800">Chart Configuration Error</h4>
            </div>
            <pre className="overflow-x-auto rounded bg-red-100 p-3 text-xs whitespace-pre-wrap text-red-700">
              {JSON.stringify(chartConfigError || {}, null, 2)}
            </pre>
          </div>
        )}

        {runSQLError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="mb-3 flex items-center space-x-2">
              <div className="h-4 w-4 flex-shrink-0 rounded-full bg-red-400"></div>
              <h4 className="text-sm font-semibold text-red-800">SQL Execution Error</h4>
            </div>
            <pre className="overflow-x-auto rounded bg-red-100 p-3 text-xs whitespace-pre-wrap text-red-700">
              {JSON.stringify(runSQLError || {}, null, 2)}
            </pre>
          </div>
        )}

        {/* Loading State */}
        {isRunningSQL && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
              <div>
                <h4 className="text-sm font-semibold text-blue-800">Executing SQL Query</h4>
                <p className="mt-1 text-xs text-blue-600">
                  Please wait while we process your query...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checklist */}
        {!(chartConfig && data && hasRunSQL && dataSourceId) && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="mb-4 flex items-center space-x-2">
              <div className="h-4 w-4 flex-shrink-0 rounded-full bg-amber-400"></div>
              <h4 className="text-sm font-semibold text-amber-800">Setup Checklist</h4>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center space-x-3">
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${chartConfig ? 'bg-green-400' : 'bg-yellow-300'}`}></div>
                <span
                  className={`text-sm ${chartConfig ? 'text-green-700 line-through' : 'text-amber-700'}`}>
                  Chart configuration is {chartConfig ? 'ready' : 'missing'}
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${data.length > 0 ? 'bg-green-400' : 'bg-yellow-300'}`}></div>
                <span
                  className={`text-sm ${data.length > 0 ? 'text-green-700 line-through' : 'text-amber-700'}`}>
                  Data is {data.length > 0 ? 'available' : 'not available'}
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${hasRunSQL ? 'bg-green-400' : 'bg-yellow-300'}`}></div>
                <span
                  className={`text-sm ${hasRunSQL ? 'text-green-700 line-through' : 'text-amber-700'}`}>
                  SQL has {hasRunSQL ? 'been executed' : 'not been run'}
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${dataSourceId ? 'bg-green-400' : 'bg-yellow-300'}`}></div>
                <span
                  className={`text-sm ${dataSourceId ? 'text-green-700 line-through' : 'text-amber-700'}`}>
                  Data Source ID is {dataSourceId ? 'set' : 'not set'}
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Chart Display */}
        {chartConfig && data && hasRunSQL && dataSourceId && (
          <div className="rounded-md border bg-gradient-to-br from-green-50 to-blue-50 p-6">
            <div className="mb-4 flex items-center space-x-2">
              <div className="h-3 w-3 flex-shrink-0 animate-pulse rounded-full bg-green-500"></div>
              <h4 className="text-sm font-semibold text-green-800">Chart Ready</h4>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <BusterChartDynamic {...chartConfig} data={data} columnMetadata={columnMetadata} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen p-4">
      <AppSplitter
        autoSaveId="chart-playground"
        splitterClassName="mx-2"
        defaultLayout={DEFAULT_LAYOUT}
        className="h-full w-full"
        leftPanelMinSize="200px"
        rightPanelMinSize="200px"
        leftChildren={leftPanelContent}
        rightChildren={rightPanelContent}
        preserveSide="left"
      />
    </div>
  );
}

const DEFAULT_LAYOUT = ['40%', 'auto'];
