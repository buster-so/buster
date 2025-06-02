import Cookies from 'js-cookie';
import type React from 'react';
import { useMemo } from 'react';
import type { AppSplitterRef } from '@/components/ui/layouts';
import { createAutoSaveId } from '@/components/ui/layouts/AppSplitterOld/helper';
import { useMemoizedFn, useUpdateLayoutEffect } from '@/hooks';

const defaultSqlOpenLayout = ['80%', 'auto'];
const defaultSqlLayout = ['0px', 'auto'];

export const useMetricResultsLayout = ({
  useSQL,
  appSplitterRef,
  autoSaveId
}: {
  useSQL: boolean;
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
  autoSaveId: string;
}) => {
  const defaultOpenLayout = defaultSqlOpenLayout;
  const defaultOriginalLayout = defaultSqlLayout;

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
    if (useSQL) {
      return secondaryLayoutDimensions;
    }
    return defaultOriginalLayout as [string, string];
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
    animateOpenSplitter(useSQL ? 'both' : 'metric');
  }, [useSQL]);

  return {
    defaultLayout
  };
};
