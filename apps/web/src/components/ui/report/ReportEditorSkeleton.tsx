import React from 'react';
import ChartStackedBar from '@/components/ui/icons/NucleoIconFilled/chart-line-2';
import { cn } from '@/lib/classMerge';

export type SkeletonElement = 'header' | 'image' | 'chart' | 'paragraphs' | 'additionalContent';

interface ReportEditorSkeletonProps {
  className?: string;
  /** Array of skeleton elements to render. Defaults to all elements if not provided */
  elements?: SkeletonElement[];
  showToolbar?: boolean;
}

/**
 * Skeleton loader component for the report editor
 * Displays placeholder content while the actual editor is loading
 *
 * @param className - Additional CSS classes to apply
 * @param elements - Array of skeleton elements to render. Available options:
 *                   - 'toolbar': Editor toolbar with tool buttons
 *                   - 'header': Title and subtitle placeholders
 *                   - 'image': Image placeholder with icon
 *                   - 'chart': Chart placeholder with chart icon
 *                   - 'paragraphs': Multiple paragraph text placeholders
 *                   - 'additionalContent': Additional content blocks in grid layout
 *
 * @example
 * // Show all elements (default)
 * <ReportEditorSkeleton />
 *
 * @example
 * // Show only toolbar and header
 * <ReportEditorSkeleton elements={['toolbar', 'header']} />
 *
 * @example
 * // Show only content without toolbar
 * <ReportEditorSkeleton elements={['header', 'image', 'paragraphs']} />
 *
 * @example
 * // Show chart instead of image
 * <ReportEditorSkeleton elements={['header', 'chart', 'paragraphs']} />
 */
const DEFAULT_ELEMENTS: SkeletonElement[] = [
  'header',
  'paragraphs',
  'chart',
  'additionalContent',
  'paragraphs',
];

export function ReportEditorSkeleton({
  className,
  elements = DEFAULT_ELEMENTS,
  showToolbar = false,
}: ReportEditorSkeletonProps) {
  return (
    <div className={cn('mx-auto mt-8 w-full space-y-6', className)}>
      {/* Toolbar skeleton */}
      {showToolbar && (
        <div className="border-border flex h-11 w-full animate-pulse items-center justify-between border-b bg-transparent px-3">
          <div className="flex items-center space-x-2.5">
            {/* Tool buttons */}
            <div className="bg-muted w- h-7 rounded"></div>
            <div className="bg-muted h-7 w-7 rounded"></div>
            <div className="bg-muted h-7 w-7 rounded"></div>
            <div className="bg-border h-6 w-px"></div>
            <div className="bg-muted h-7 w-7 rounded"></div>
            <div className="bg-muted h-7 w-7 rounded"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-muted h-7 w-20 rounded"></div>
            <div className="bg-muted h-7 w-16 rounded"></div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="px-0 pb-12">
        <div className="border-border animate-pulse space-y-6 rounded-lg bg-transparent">
          {elements.map((item, index) => (
            <React.Fragment key={`${item}-${index}`}>
              {item === 'header' && <HeaderSkeleton />}
              {item === 'image' && <ImageSkeleton />}
              {item === 'chart' && <ChartSkeleton />}
              {item === 'paragraphs' && <ParagraphsSkeleton />}
              {item === 'additionalContent' && <AdditionalContentSkeleton />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

const HeaderSkeleton = () => {
  return (
    <div className="space-y-3">
      <div className="bg-muted h-10 w-3/4 rounded-lg"></div>
      <div className="bg-muted h-4 w-1/2 rounded"></div>
    </div>
  );
};

const ImageSkeleton = () => {
  return (
    <div className="bg-muted flex h-48 w-full items-center justify-center rounded-lg">
      <div className="bg-muted-foreground/5 flex h-16 w-16 items-center justify-center rounded-lg">
        <svg
          className="text-muted-foreground/40 h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
};

const ChartSkeleton = () => {
  return (
    <div className="bg-muted flex w-full items-center justify-center rounded-lg">
      <div className="bg-muted-foreground/3 m-5 mx-5 flex h-full min-h-56 w-full items-center justify-center rounded-lg">
        <div className="text-muted-foreground/15 flex h-full w-full items-center justify-center text-[40px]">
          <ChartStackedBar />
        </div>
      </div>
    </div>
  );
};

const ParagraphsSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* First paragraph */}
      <div className="space-y-2">
        <div className="bg-muted h-4 w-full rounded"></div>
        <div className="bg-muted h-4 w-11/12 rounded"></div>
        <div className="bg-muted h-4 w-4/5 rounded"></div>
      </div>

      {/* Second paragraph */}
      <div className="space-y-2">
        <div className="bg-muted h-4 w-full rounded"></div>
        <div className="bg-muted h-4 w-5/6 rounded"></div>
        <div className="bg-muted h-4 w-3/4 rounded"></div>
        <div className="bg-muted h-4 w-2/3 rounded"></div>
      </div>

      {/* Third paragraph */}
      <div className="space-y-2">
        <div className="bg-muted h-4 w-full rounded"></div>
        <div className="bg-muted h-4 w-4/5 rounded"></div>
      </div>
    </div>
  );
};

const AdditionalContentSkeleton = () => {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="bg-muted h-6 w-2/3 rounded"></div>
        <div className="bg-muted h-4 w-full rounded"></div>
        <div className="bg-muted h-4 w-3/4 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-6 w-1/2 rounded"></div>
        <div className="bg-muted h-4 w-full rounded"></div>
        <div className="bg-muted h-4 w-5/6 rounded"></div>
      </div>
    </div>
  );
};
