import { useDraggable } from '@platejs/dnd';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import {
  PlateElement,
  type PlateElementProps,
  useEditorRef,
  useElement,
  useFocused,
  useReadOnly,
  useSelected,
  withHOC,
} from 'platejs/react';
import React, { type PropsWithChildren, useCallback, useMemo, useRef } from 'react';
import type { BusterMetric, BusterMetricData } from '@/api/asset_interfaces/metric';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useGetReportParams } from '@/context/Reports/useGetReportParams';
import { useSize } from '@/hooks/useSize';
import { cn } from '@/lib/classMerge';
import { GlobalVariablePlugin } from '../../plugins/global-variable-kit';
import type { TMetricElement } from '../../plugins/metric-kit';
import { Caption, CaptionTextarea } from '../CaptionNode';
import { mediaResizeHandleVariants, Resizable, ResizeHandle } from '../ResizeHandle';
import { MetricContent } from './MetricContent';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';
import { MetricToolbar } from './MetricToolbar';

type MetricElementProps = PlateElementProps<TMetricElement>;

export const MetricElement = withHOC(
  ResizableProvider,
  function MetricElement({ attributes, children, ...props }: MetricElementProps) {
    const metricId = props.element.metricId;
    const metricVersionNumber = props.element.metricVersionNumber;
    const readOnly = useReadOnly();
    const mode = props.editor.getOption(GlobalVariablePlugin, 'mode');
    const { reportId } = useGetReportParams();
    const isSelected = useSelected();
    const isFocused = useFocused();
    const showFocused = isSelected && isFocused;
    const className = cn(
      'max-h-[390px]',
      showFocused && 'ring-ring bg-brand/5 ring-1 ring-offset-4'
    );

    const { data: selectedChartType } = useGetMetric(
      { id: metricId, versionNumber: metricVersionNumber },
      { select: useCallback((x: BusterMetric) => x?.chart_config?.selectedChartType, []) }
    );
    const { isFetched: isFetchedMetricData } = useGetMetricData(
      { id: metricId, versionNumber: metricVersionNumber, cacheDataId: reportId },
      { select: useCallback((x: BusterMetricData) => x, []) }
    );
    const isTable = selectedChartType === 'table' && isFetchedMetricData;

    const content = metricId ? (
      <MetricToolbar selectedMetricId={metricId}>
        <MetricResizeContainer isTable={isTable}>
          <MetricContent
            metricId={metricId}
            metricVersionNumber={metricVersionNumber}
            readOnly={readOnly}
            isExportMode={mode === 'export'}
            className={className}
          />
        </MetricResizeContainer>
      </MetricToolbar>
    ) : (
      <MetricEmbedPlaceholder className={className} />
    );

    return (
      <PlateElement
        className="rounded mt-2.5 mb-4.5"
        attributes={{
          ...attributes,
          'data-plate-open-context-menu': true,
          // Mark metric element for export so we can target it for rasterization
          'data-export-metric': true,
        }}
        {...props}
      >
        <span contentEditable={false}>{content}</span>
        {children}
      </PlateElement>
    );
  }
);

const MetricResizeContainer: React.FC<PropsWithChildren<{ isTable: boolean }>> = ({
  children,
  isTable,
}) => {
  const width = (useResizableValue('width') as number) || 700;
  const ref = useRef<HTMLDivElement>(null);
  const element = useElement();
  const editor = useEditorRef();
  const editorWidth = useSize(ref)?.width ?? 700;
  const isSelected = useSelected();
  const align = 'center'; // Default align for metrics

  const selectNode = () => {
    editor?.tf.select(element);
  };

  const height = useMemo(() => {
    if (isTable) return undefined;
    const ratio = 9 / 16;
    if (typeof width !== 'number') return (editorWidth ?? 400) * ratio;
    return width * ratio;
  }, [width, editorWidth, isTable]);

  return (
    <figure
      data-metric-figure
      onClick={selectNode}
      ref={ref}
      contentEditable={false}
      className={cn(
        'relative m-0 w-full cursor-default transition-all',
        isSelected && 'bg-item-hover/10 rounded'
      )}
    >
      <Resizable
        align={align}
        options={{
          align,
          minWidth: 350,
        }}
      >
        <ResizeHandle
          className={mediaResizeHandleVariants({ direction: 'left' })}
          options={{ direction: 'left' }}
        />

        <div
          // ref={handleRef}
          className={cn(
            !isTable && 'min-h-[390px]',
            !height && !isTable && 'min-h-[390px]'
            //   isDragging && 'cursor-grabbing opacity-50'
          )}
          style={{ height }}
        >
          {children}
        </div>

        <ResizeHandle
          className={mediaResizeHandleVariants({ direction: 'right' })}
          options={{ direction: 'right' }}
        />
      </Resizable>

      <Caption style={{ width }} align={align}>
        <CaptionTextarea placeholder="Write a caption..." />
      </Caption>
    </figure>
  );
};
