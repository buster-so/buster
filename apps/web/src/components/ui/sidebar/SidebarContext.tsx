import { useMemo } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import {
  useAppSplitterAnimateWidth,
  useAppSplitterSizes,
  useAppSplitterSizesInPixels,
} from '../layouts/AppSplitter/AppSplitterProvider';
import {
  COLLAPSED_SIDEBAR_WIDTH,
  COLLAPSED_SIDEBAR_WIDTH_NUMBER,
  DEFAULT_SIDEBAR_WIDTH,
} from './config';

const useSidebarContext = ({
  onCollapseClick,
}: {
  onCollapseClick?: (isCollapsed: boolean) => void;
}) => {
  const sizes = useAppSplitterSizes();

  const width = useMemo(() => {
    if (typeof sizes[0] === 'number') {
      return sizes[0];
    }

    return parseInt(sizes[0], 10);
  }, [sizes[0]]);

  const isSidebarCollapsed = useMemo(() => {
    return width < COLLAPSED_SIDEBAR_WIDTH_NUMBER;
  }, [width]);

  const animateWidth = useAppSplitterAnimateWidth();
  const getSizesInPixels = useAppSplitterSizesInPixels();

  const onCollapseClickPreflight = useMemoizedFn(() => {
    const sizes = getSizesInPixels();
    const parsedCollapsedWidth = parseInt(COLLAPSED_SIDEBAR_WIDTH, 10) + 6; //6 for a little buffer
    const parsedCurrentSize = sizes[0];
    const isCollapsed = parsedCurrentSize <= parsedCollapsedWidth;
    onCollapseClick?.(isCollapsed);
    const targetWidth = !isCollapsed ? COLLAPSED_SIDEBAR_WIDTH : DEFAULT_SIDEBAR_WIDTH;
    animateWidth(targetWidth, 'left', 200);
  });

  return {
    width,
    isSidebarCollapsed,
    onCollapseClickPreflight,
  };
};

export const SidebarContext = createContext<ReturnType<typeof useSidebarContext>>(
  {} as ReturnType<typeof useSidebarContext>
);

export const SidebarContextProvider = ({
  children,
  onCollapseClick,
}: { children: React.ReactNode } & Parameters<typeof useSidebarContext>[0]) => {
  return (
    <SidebarContext.Provider value={useSidebarContext({ onCollapseClick })}>
      {children}
    </SidebarContext.Provider>
  );
};

const stableOnCollapseClickPreflight = (context: ReturnType<typeof useSidebarContext>) =>
  context.onCollapseClickPreflight;
export const useSidebarOnCollapseClick = () => {
  return useContextSelector(SidebarContext, stableOnCollapseClickPreflight);
};

const stableIsCollapsed = (context: ReturnType<typeof useSidebarContext>) =>
  context.isSidebarCollapsed;
export const useSidebarIsCollapsed = () => {
  return useContextSelector(SidebarContext, stableIsCollapsed);
};
