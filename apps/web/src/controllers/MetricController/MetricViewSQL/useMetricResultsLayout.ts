import Cookies from 'js-cookie';
import type React from 'react';
import { useMemo } from 'react';
import { useMemoizedFn, useUpdateLayoutEffect } from '@/hooks';
import { createAutoSaveId, type AppSplitterRef } from '@/components/ui/layouts/AppSplitter';

const defaultSqlOpenLayout = ['80%', 'auto'];

export const useMetricResultsLayout = ({
  appSplitterRef,
  autoSaveId
}: {
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
  autoSaveId: string;
}) => {
  const defaultOpenLayout = defaultSqlOpenLayout;

  const secondaryLayoutDimensions: [string, string] = useMemo(() => {
    const cookieKey = createAutoSaveId(autoSaveId);
    const cookieValue = Cookies.get(cookieKey);
    if (cookieValue) {
      try {
        const parsedValue = JSON.parse(cookieValue) as string[];
        if (!parsedValue?.some((item) => item === 'auto')) {
          return parsedValue as [string, string];
        }
      } catch (error) {
        //
      }
    }
    return defaultOpenLayout as [string, string];
  }, []);

  const defaultLayout: [string, string] = useMemo(() => {
    return secondaryLayoutDimensions;
  }, []);

  const animateOpenSplitter = useMemoizedFn((side: 'metric' | 'both') => {
    if (!appSplitterRef.current) return;

    if (side === 'metric') {
      appSplitterRef.current.animateWidth('0px', 'left');
    } else if (side === 'both') {
      appSplitterRef.current.animateWidth('40%', 'left');
    }
  });

  useUpdateLayoutEffect(() => {
    animateOpenSplitter('both');
  }, []);

  return {
    defaultLayout
  };
};
