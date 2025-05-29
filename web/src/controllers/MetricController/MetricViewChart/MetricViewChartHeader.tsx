import { Text } from '@/components/ui/typography';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { cn } from '@/lib/classMerge';
import React from 'react';

export const METRIC_CHART_TITLE_INPUT_ID = 'metric-chart-title-input';

export const MetricViewChartHeader: React.FC<{
  className?: string;
  name: string | undefined;
  description: string | undefined | null;
  timeFrame: string | undefined;
  onSetTitle: (value: string) => void;
  readOnly: boolean;
}> = React.memo(({ className, name = '', description, timeFrame, onSetTitle, readOnly }) => {
  const hasTitleOrDescription = !!name || !!description;

  return (
    <div
      className={cn(
        'flex max-h-13 min-h-13 flex-col justify-center space-y-0.5 overflow-hidden',
        className
      )}>
      {hasTitleOrDescription ? (
        <>
          <EditableTitle
            id={METRIC_CHART_TITLE_INPUT_ID}
            level={4}
            readOnly={readOnly}
            inputClassName="h-auto!"
            placeholder="New chart"
            onChange={onSetTitle}>
            {name}
          </EditableTitle>
          <div className="flex items-center space-x-1 whitespace-nowrap">
            {!!timeFrame && (
              <>
                <Text size={'sm'} variant="secondary" className="leading-1.3">
                  {timeFrame}
                </Text>
                <Text size={'sm'} variant="secondary">
                  •
                </Text>
              </>
            )}

            <Text size={'sm'} variant="secondary" className="leading-1.3" truncate>
              {description}
            </Text>
          </div>
        </>
      ) : null}
    </div>
  );
});

MetricViewChartHeader.displayName = 'MetricViewChartHeader';
