import { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import React, { useMemo, useState } from 'react';
import type { ChartEncodes, Trendline } from '@/components/charts';
import { v4 as uuidv4 } from 'uuid';
import { useSet, useMemoizedFn } from 'ahooks';
import { LabelAndInput } from '../../Common';
import { Button, ColorPicker, Divider, Input, Select, Switch } from 'antd';
import { AppMaterialIcons } from '@/components';
import { AnimatePresence, motion } from 'framer-motion';
import { CollapseDelete } from '../../Common/CollapseDelete';
import { formatLabel } from '@/utils';
import { ColumnMetaData } from '@/api/buster-rest';
import { TrendlineColumnId } from './EditTrendlineColumnId';
import { TrendlineColorPicker } from './EditTrendlineColorPicker';
import { TrendlineLabel } from './EditTrendlineLabel';
import { EditTrendlineShowLine } from './EditTrendlineShowLine';
import { EditTrendlineOption } from './EditTrendlineOption';
import { TypeToLabel } from './config';

export interface LoopTrendline extends Trendline {
  id: string;
}

export const EditTrendline: React.FC<{
  trendlines: IBusterThreadMessageChartConfig['trendlines'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
  selectedAxis: ChartEncodes;
  columnMetadata: ColumnMetaData[];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
}> = React.memo(
  ({
    trendlines,
    onUpdateChartConfig,
    selectedAxis,
    columnMetadata,
    columnLabelFormats,
    selectedChartType
  }) => {
    const [trends, _setTrends] = useState<LoopTrendline[]>(
      trendlines.map((trend) => ({ ...trend, id: uuidv4() }))
    );
    const [newTrendIds, { add: addNewTrendId }] = useSet<string>();

    const setTrends = useMemo(() => {
      return (
        setTrends: (prev: LoopTrendline[]) => LoopTrendline[],
        saveToExternal: boolean = true
      ) => {
        _setTrends((trendlines) => {
          const result = setTrends(trendlines);
          if (saveToExternal) {
            onUpdateTrendlines(result);
          }
          return result;
        });
      };
    }, []);

    const onAddTrendline = useMemoizedFn(() => {
      const newTrendline: Required<LoopTrendline> = {
        id: uuidv4(),
        show: true,
        showTrendlineLabel: false,
        trendlineLabel: null,
        type: 'linear_regression',
        trendLineColor: null,
        columnId: selectedAxis.y[0] || ''
      };

      addNewTrendId(newTrendline.id);
      setTrends((prev) => {
        return [...prev, newTrendline];
      });
    });

    const onUpdateTrendlines = useMemoizedFn((trends: LoopTrendline[]) => {
      const newTrends = trends.map(({ id, ...rest }) => ({
        ...rest
      }));

      setTimeout(() => {
        onUpdateChartConfig({ trendlines: newTrends });
      }, 30);
    });

    const onDeleteTrendline = useMemoizedFn((id: string) => {
      setTrends((prev) => {
        return prev.filter((trend) => trend.id !== id);
      });
    });

    const onUpdateExisitingTrendline = useMemoizedFn((trend: LoopTrendline) => {
      setTrends((prev) => {
        return prev.map((t) => (t.id === trend.id ? trend : t));
      });
    });

    const memoizedAnimations = useMemo(() => {
      return {
        animate: {
          opacity: 1,
          height: 'auto',
          transition: {
            height: { type: 'spring', bounce: 0.2, duration: 0.6 },
            opacity: { duration: 0.2 }
          }
        },
        exit: {
          opacity: 0,
          height: 0,
          y: -5,
          transition: {
            height: { duration: 0.2 },
            opacity: { duration: 0.2 }
          }
        }
      };
    }, [trends]);

    return (
      <div className="flex flex-col space-y-2.5">
        <LabelAndInput label="Trend line">
          <div className="flex items-center justify-end">
            <Button onClick={onAddTrendline} type="text" icon={<AppMaterialIcons icon="add" />}>
              Add trend line
            </Button>
          </div>
        </LabelAndInput>

        <AnimatePresence mode="popLayout" initial={false}>
          {trends.map((trend) => (
            <motion.div
              key={trend.id}
              layout="position"
              layoutId={trend.id}
              initial={{ opacity: 0, height: 0 }}
              animate={memoizedAnimations.animate}
              exit={memoizedAnimations.exit}>
              <EditTrendlineItem
                trend={trend}
                columnMetadata={columnMetadata}
                columnLabelFormats={columnLabelFormats}
                yAxisEncodes={selectedAxis.y}
                xAxisEncodes={selectedAxis.x}
                selectedChartType={selectedChartType}
                onDeleteTrendline={onDeleteTrendline}
                onUpdateExisitingTrendline={onUpdateExisitingTrendline}
                isNewTrend={newTrendIds.has(trend.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);
EditTrendline.displayName = 'EditTrendline';

const EditTrendlineItem: React.FC<{
  trend: LoopTrendline;
  isNewTrend: boolean;
  columnMetadata: ColumnMetaData[];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  yAxisEncodes: string[];
  xAxisEncodes: string[];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
  onDeleteTrendline: (id: string) => void;
}> = ({
  trend,
  isNewTrend,
  columnLabelFormats,
  columnMetadata,
  yAxisEncodes,
  xAxisEncodes,
  selectedChartType,
  onUpdateExisitingTrendline,
  onDeleteTrendline
}) => {
  const title = useMemo(() => {
    if (trend.trendlineLabel) return trend.trendlineLabel;
    const hasMultipleColumns = yAxisEncodes.length > 1;
    const trendType = TypeToLabel[trend.type] || 'Trend';
    const labels = [trendType];
    if (hasMultipleColumns) {
      const columnLabelFormat = columnLabelFormats[trend.columnId];
      const formattedLabel = formatLabel(trend.columnId || 'Trend', columnLabelFormat, true);
      labels.push(formattedLabel);
    }
    return labels.join(' | ');
  }, [trend.type, trend.trendlineLabel, trend.columnId, columnLabelFormats, yAxisEncodes]);

  return (
    <CollapseDelete
      initialOpen={isNewTrend}
      title={title}
      onDelete={() => onDeleteTrendline(trend.id)}>
      <TrendlineItemContent
        trend={trend}
        columnMetadata={columnMetadata}
        columnLabelFormats={columnLabelFormats}
        yAxisEncodes={yAxisEncodes}
        xAxisEncodes={xAxisEncodes}
        selectedChartType={selectedChartType}
        onUpdateExisitingTrendline={onUpdateExisitingTrendline}
      />
    </CollapseDelete>
  );
};
EditTrendlineItem.displayName = 'EditTrendlineItem';

const TrendlineItemContent: React.FC<{
  trend: LoopTrendline;
  columnMetadata: ColumnMetaData[];
  yAxisEncodes: string[];
  xAxisEncodes: string[];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
}> = React.memo(
  ({
    trend,
    yAxisEncodes,
    xAxisEncodes,
    columnMetadata,
    columnLabelFormats,
    selectedChartType,
    onUpdateExisitingTrendline
  }) => {
    const { show } = trend;

    return (
      <div className="flex w-full flex-col overflow-hidden">
        <div className="flex flex-col space-y-2.5 p-2.5">
          <EditTrendlineShowLine
            trend={trend}
            onUpdateExisitingTrendline={onUpdateExisitingTrendline}
          />

          <TrendlineColumnId
            trend={trend}
            columnMetadata={columnMetadata}
            columnLabelFormats={columnLabelFormats}
            yAxisEncodes={yAxisEncodes}
            onUpdateExisitingTrendline={onUpdateExisitingTrendline}
          />

          <EditTrendlineOption
            trend={trend}
            onUpdateExisitingTrendline={onUpdateExisitingTrendline}
            yAxisEncodes={yAxisEncodes}
            xAxisEncodes={xAxisEncodes}
            columnLabelFormats={columnLabelFormats}
            selectedChartType={selectedChartType}
          />

          <TrendlineColorPicker
            trend={trend}
            onUpdateExisitingTrendline={onUpdateExisitingTrendline}
          />
        </div>

        {show && (
          <>
            <Divider className="!mb-1" />

            <div className="flex flex-col space-y-2.5 p-2.5">
              <TrendlineLabel
                trend={trend}
                onUpdateExisitingTrendline={onUpdateExisitingTrendline}
              />
            </div>
          </>
        )}
      </div>
    );
  }
);
TrendlineItemContent.displayName = 'TrendlineItemContent';
