'use client';

import {
  PlateElement,
  type PlateElementProps,
  useEditorRef,
  useElement,
  useFocused,
  useReadOnly,
  useSelected,
  withHOC
} from 'platejs/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';
import { MetricToolbar } from './MetricToolbar';
import { Caption, CaptionTextarea } from '../CaptionNode';
import { mediaResizeHandleVariants, Resizable, ResizeHandle } from '../ResizeHandle';
import { type TMetricElement } from '../../plugins/metric-plugin';
import React, { useMemo, useRef, type PropsWithChildren } from 'react';
import { useSize } from '@/hooks/useSize';
import { MetricContent } from './MetricContent';
import { cn } from '@/lib/classMerge';
import { useDraggable } from '@platejs/dnd';

type MetricElementProps = PlateElementProps<TMetricElement>;

export const MetricElement = withHOC(
  ResizableProvider,
  function MetricElement({ attributes, children, ...props }: MetricElementProps) {
    const metricId = props.element.metricId;
    const metricVersionNumber = props.element.metricVersionNumber;
    const readOnly = useReadOnly();

    const content = metricId ? (
      <MetricToolbar selectedMetricId={metricId}>
        <MetricResizeContainer>
          <MetricContent
            metricId={metricId}
            metricVersionNumber={metricVersionNumber}
            readOnly={readOnly}
          />
        </MetricResizeContainer>
      </MetricToolbar>
    ) : (
      <MetricEmbedPlaceholder />
    );

    return (
      <PlateElement
        className="rounded-md"
        attributes={{
          ...attributes,
          'data-plate-open-context-menu': true
        }}
        {...props}>
        <div contentEditable={false}>{content}</div>

        <div className="h-0" contentEditable={false}>
          {children}
        </div>
      </PlateElement>
    );
  }
);

const MetricResizeContainer: React.FC<PropsWithChildren> = ({ children }) => {
  const width = useResizableValue('width');
  const ref = useRef<HTMLDivElement>(null);
  const element = useElement();
  const editor = useEditorRef();
  const editorWidth = useSize(ref)?.width ?? 400;
  const isSelected = useSelected();
  const isFocused = useFocused();
  const { isDragging, handleRef } = useDraggable({
    element: element
  });
  const align = 'center'; // Default align for metrics

  const selectNode = () => {
    editor?.tf.select(element);
  };

  const height = useMemo(() => {
    const ratio = 9 / 16;
    if (typeof width !== 'number') return (editorWidth ?? 400) * ratio;
    return width * ratio;
  }, [width, editorWidth]);

  return (
    <figure
      onClick={selectNode}
      ref={ref}
      contentEditable={false}
      className={cn(
        'group relative m-0 my-1.5 w-full cursor-default transition-all',
        isSelected && 'bg-item-hover/10 rounded'
      )}>
      <Resizable
        align={align}
        options={{
          align,
          minWidth: 350
        }}>
        <ResizeHandle
          className={mediaResizeHandleVariants({ direction: 'left' })}
          options={{ direction: 'left' }}
        />

        <div
          ref={handleRef}
          className={cn('min-h-64', isDragging && 'cursor-grabbing opacity-50')}
          style={{ height }}>
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
