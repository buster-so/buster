import { DEFAULT_TRENDLINE_CONFIG, type IBusterMetricChartConfig } from '@/api/asset_interfaces';
import type { ColumnMetaData } from '@/api/asset_interfaces';
import type { ChartEncodes, ScatterAxis, Trendline } from '@/api/asset_interfaces/metric/charts';
import { Button } from '@/components/ui/buttons';
import { JOIN_CHARACTER } from '@/components/ui/charts/commonHelpers';
import { Plus } from '@/components/ui/icons';
import { Separator } from '@/components/ui/seperator';
import { useMemoizedFn, useSet } from '@/hooks';
import { formatLabel } from '@/lib';
import { AnimatePresence, motion } from 'framer-motion';
import isEqual from 'lodash/isEqual';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LabelAndInput } from '../../Common';
import { CollapseDelete } from '../../Common/CollapseDelete';
import { TrendlineColorPicker } from './EditTrendlineColorPicker';
import { TrendlineColumnId } from './EditTrendlineColumnId';
import { TrendlineLabel } from './EditTrendlineLabel';
import { EditTrendlineOption } from './EditTrendlineOption';
import { EditTrendlineShowLine } from './EditTrendlineShowLine';
import { TrendlineAggregateAllCategories } from './TrendlineAggregateAllCategories';
import { TrendlineLineStyle } from './TrendlineLineStyle';
import { TrendlinePolynomialOrder } from './TrendlinePolynomialOrder';
import { TypeToLabel } from './config';
// import { TrendlineProjection } from './TrendlineProjection';
// import { TrendlinePolynomialOrder } from './TrendlinePolynomialOrder';

export interface LoopTrendline extends Trendline {
  id: string;
}

export const EditTrendline: React.FC<{
  trendlines: IBusterMetricChartConfig['trendlines'];
  colors: string[];
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
  selectedAxis: ChartEncodes;
  columnMetadata: ColumnMetaData[];
  columnLabelFormats: IBusterMetricChartConfig['columnLabelFormats'];
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
}> = React.memo(
  ({
    trendlines,
    colors,
    onUpdateChartConfig,
    selectedAxis,
    columnMetadata,
    columnLabelFormats,
    selectedChartType
  }) => {
    const [trends, _setTrends] = useState<LoopTrendline[]>(
      trendlines.map((trend) => ({ ...trend, id: trend.id || uuidv4() }))
    );
    const [newTrendIds, { add: addNewTrendId }] = useSet<string>();

    const setTrends = useMemo(() => {
      return (setTrends: (prev: LoopTrendline[]) => LoopTrendline[], saveToExternal = true) => {
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
      const getNewType = () => {
        const types = [
          'linear_regression',
          'polynomial_regression',
          'exponential_regression',
          'logarithmic_regression',
          'average',
          'min',
          'max',
          'median'
        ] as const;
        return types[Math.floor(Math.random() * types.length)];
      };

      const hasLinearRegression = trends.some((trend) => trend.type === 'linear_regression');
      const type = hasLinearRegression ? getNewType() : ('linear_regression' as const);

      const newTrendline: Required<LoopTrendline> = {
        ...DEFAULT_TRENDLINE_CONFIG,
        id: uuidv4(),
        type,
        columnId: selectedAxis.y[0] || '',
        aggregateAllCategories: ((selectedAxis as ScatterAxis).category || []).length >= 1
      };

      addNewTrendId(newTrendline.id);
      setTrends((prev) => {
        return [...prev, newTrendline];
      });
    });

    const onUpdateTrendlines = useMemoizedFn((trends: LoopTrendline[]) => {
      setTimeout(() => {
        onUpdateChartConfig({ trendlines: trends });
      }, 30);
    });

    const onDeleteTrendline = useMemoizedFn((id: string) => {
      setTrends((prev) => {
        return prev.filter((trend) => trend.id !== id);
      });
    });

    const onUpdateExistingTrendline = useMemoizedFn((trend: LoopTrendline) => {
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

    useEffect(() => {
      const updatedTrends = trendlines.map((trend) => ({ ...trend, id: trend.id || uuidv4() }));

      if (!isEqual(updatedTrends, trends)) {
        _setTrends(updatedTrends);
      }
    }, [trendlines]);

    return (
      <div className="flex flex-col space-y-2.5">
        <LabelAndInput label="Trend lines">
          <div className="flex items-center justify-end">
            <Button onClick={onAddTrendline} variant="ghost" prefix={<Plus />}>
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
                categoryEncodes={(selectedAxis as ScatterAxis).category}
                selectedChartType={selectedChartType}
                onDeleteTrendline={onDeleteTrendline}
                onUpdateExistingTrendline={onUpdateExistingTrendline}
                isNewTrend={newTrendIds.has(trend.id)}
                colors={colors}
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
  columnLabelFormats: IBusterMetricChartConfig['columnLabelFormats'];
  yAxisEncodes: string[];
  xAxisEncodes: string[];
  categoryEncodes: string[] | undefined;
  colors: string[];
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
  onUpdateExistingTrendline: (trend: LoopTrendline) => void;
  onDeleteTrendline: (id: string) => void;
}> = React.memo(
  ({
    trend,
    isNewTrend,
    columnLabelFormats,
    columnMetadata,
    yAxisEncodes,
    xAxisEncodes,
    categoryEncodes,
    colors,
    selectedChartType,
    onUpdateExistingTrendline,
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
      return labels.join(JOIN_CHARACTER);
    }, [trend.type, trend.trendlineLabel, trend.columnId, columnLabelFormats, yAxisEncodes]);

    return (
      <CollapseDelete
        initialOpen={isNewTrend}
        title={title}
        dataTestId={`trendline-${title}`}
        onDelete={() => onDeleteTrendline(trend.id)}>
        <TrendlineItemContent
          trend={trend}
          columnMetadata={columnMetadata}
          columnLabelFormats={columnLabelFormats}
          yAxisEncodes={yAxisEncodes}
          xAxisEncodes={xAxisEncodes}
          colors={colors}
          categoryEncodes={categoryEncodes}
          selectedChartType={selectedChartType}
          onUpdateExistingTrendline={onUpdateExistingTrendline}
        />
      </CollapseDelete>
    );
  }
);
EditTrendlineItem.displayName = 'EditTrendlineItem';

const TrendlineItemContent: React.FC<{
  trend: LoopTrendline;
  columnMetadata: ColumnMetaData[];
  yAxisEncodes: string[];
  xAxisEncodes: string[];
  colors: string[];
  categoryEncodes: string[] | undefined;
  columnLabelFormats: IBusterMetricChartConfig['columnLabelFormats'];
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
  onUpdateExistingTrendline: (trend: LoopTrendline) => void;
}> = React.memo(
  ({
    trend,
    colors,
    categoryEncodes,
    yAxisEncodes,
    xAxisEncodes,
    columnMetadata,
    columnLabelFormats,
    selectedChartType,
    onUpdateExistingTrendline
  }) => {
    const { show } = trend;

    return (
      <div className="flex w-full flex-col overflow-hidden">
        <div className="flex flex-col space-y-2.5 p-2.5">
          <EditTrendlineShowLine
            trend={trend}
            onUpdateExistingTrendline={onUpdateExistingTrendline}
          />

          {show && (
            <>
              <TrendlineColumnId
                trend={trend}
                columnMetadata={columnMetadata}
                columnLabelFormats={columnLabelFormats}
                yAxisEncodes={yAxisEncodes}
                onUpdateExistingTrendline={onUpdateExistingTrendline}
              />

              <EditTrendlineOption
                trend={trend}
                onUpdateExistingTrendline={onUpdateExistingTrendline}
                yAxisEncodes={yAxisEncodes}
                xAxisEncodes={xAxisEncodes}
                columnLabelFormats={columnLabelFormats}
                selectedChartType={selectedChartType}
              />

              <TrendlineLineStyle
                trend={trend}
                onUpdateExistingTrendline={onUpdateExistingTrendline}
              />

              <TrendlinePolynomialOrder
                trend={trend}
                onUpdateExistingTrendline={onUpdateExistingTrendline}
              />

              {/* <TrendlineProjection
            trend={trend}
            onUpdateExistingTrendline={onUpdateExistingTrendline}
          /> */}

              <TrendlineAggregateAllCategories
                trend={trend}
                categoryEncodes={categoryEncodes}
                onUpdateExistingTrendline={onUpdateExistingTrendline}
              />

              <TrendlineColorPicker
                trend={trend}
                colors={colors}
                onUpdateExistingTrendline={onUpdateExistingTrendline}
              />
            </>
          )}
        </div>

        {show && (
          <>
            <Separator className="mb-1!" />

            <div className="flex flex-col space-y-2.5 p-2.5">
              <TrendlineLabel trend={trend} onUpdateExistingTrendline={onUpdateExistingTrendline} />
            </div>
          </>
        )}
      </div>
    );
  }
);
TrendlineItemContent.displayName = 'TrendlineItemContent';
