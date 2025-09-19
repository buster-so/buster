import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import type { BusterMetric, BusterMetricData } from '@/api/asset_interfaces/metric';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { cn } from '@/lib/utils';
import { MetricChartCard } from '../MetricChartCard';
import { MetricChartEvaluation } from './MetricChartEvaluation';
import { MetricDataTruncatedWarning } from './MetricDataTruncatedWarning';

const stableMetricSelect = ({ evaluation_score, evaluation_summary }: BusterMetric) => ({
  evaluation_score,
  evaluation_summary,
});
const stableMetricDataSelect = (x: BusterMetricData) => x?.has_more_records;

export const MetricViewChart: React.FC<{
  metricId: string;
  versionNumber?: number;
  cacheId?: string;
  readOnly?: boolean;
  className?: string;
  cardClassName?: string;
}> = React.memo(
  ({ metricId, versionNumber, readOnly = false, className = '', cardClassName = '', cacheId }) => {
    const { data: metric } = useGetMetric(
      { id: metricId, versionNumber },
      { select: stableMetricSelect, enabled: true }
    );
    const { data: hasMoreRecords } = useGetMetricData(
      { id: metricId, versionNumber },
      { select: stableMetricDataSelect }
    );

    return (
      <div className={cn('flex h-full flex-col justify-between space-y-3.5 p-5', className)}>
        <div className="flex h-full flex-col space-y-3">
          <MetricChartCard
            metricId={metricId}
            versionNumber={versionNumber}
            cacheId={cacheId}
            readOnly={readOnly}
            className={cardClassName}
          />
          {hasMoreRecords && <MetricDataTruncatedWarning metricId={metricId} />}
        </div>

        <MetricChartEvaluationWrapper
          evaluationScore={metric?.evaluation_score}
          evaluationSummary={metric?.evaluation_summary}
        />
      </div>
    );
  }
);

MetricViewChart.displayName = 'MetricViewChart';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 },
};

const MetricChartEvaluationWrapper: React.FC<{
  evaluationScore: BusterMetric['evaluation_score'] | undefined;
  evaluationSummary: string | undefined;
}> = ({ evaluationScore, evaluationSummary }) => {
  const show = !!evaluationScore && !!evaluationSummary;
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div {...animation}>
          <MetricChartEvaluation
            evaluationScore={evaluationScore}
            evaluationSummary={evaluationSummary}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
