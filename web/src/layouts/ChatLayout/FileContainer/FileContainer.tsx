'use client';

import { AppPageLayout, AppSplitter, type AppSplitterRef } from '@/components/ui/layouts';
import { createAutoSaveId } from '@/components/ui/layouts/AppSplitter/helper';
import { useDebounce, useMemoizedFn, useUpdateLayoutEffect } from '@/hooks';
import Cookies from 'js-cookie';
import type React from 'react';
import { useMemo, useRef } from 'react';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { FileContainerHeader } from './FileContainerHeader';
import { FileContainerSecondary } from './FileContainerSecondary';

interface FileContainerProps {
  children: React.ReactNode;
}

const defaultOpenLayout: [string, string] = ['auto', '310px'];
const defaulClosedLayout: [string, string] = ['auto', '0px'];
const autoSaveId = 'file-container-splitter';

export const FileContainer: React.FC<FileContainerProps> = ({ children }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);
  const selectedFile = useChatLayoutContextSelector((x) => x.selectedFile);
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const selectedFileViewRenderSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewRenderSecondary
  );

  const isOpenSecondary = selectedFileViewRenderSecondary;

  //we need to debounce the selectedFileViewSecondary to avoid flickering
  const debouncedSelectedFileViewSecondary = useDebounce(selectedFileViewSecondary, {
    wait: 350,
    leading: selectedFileViewRenderSecondary
  });

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
    if (isOpenSecondary) {
      return secondaryLayoutDimensions;
    }
    return defaulClosedLayout;
  }, []);

  const animateOpenSplitter = useMemoizedFn(async (side: 'open' | 'closed') => {
    if (side === 'open') {
      appSplitterRef.current?.animateWidth(defaultOpenLayout[1], 'right');
    } else {
      appSplitterRef.current?.animateWidth(defaulClosedLayout[1], 'right');
    }
  });

  const rightChildren = useMemo(() => {
    return (
      <FileContainerSecondary
        selectedFile={selectedFile}
        selectedFileViewSecondary={debouncedSelectedFileViewSecondary}
      />
    );
  }, [debouncedSelectedFileViewSecondary, selectedFile?.id, selectedFile?.type]);

  useUpdateLayoutEffect(() => {
    setTimeout(() => {
      //TODO revaluate this? What is this for?
      animateOpenSplitter(isOpenSecondary ? 'open' : 'closed');
    }, 20);
  }, [isOpenSecondary]);

  return (
    <AppPageLayout
      className="flex h-full min-w-[380px] flex-col"
      header={useMemo(() => <FileContainerHeader />, [])}
      headerClassName="">
      <AppSplitter
        ref={appSplitterRef}
        autoSaveId={autoSaveId}
        defaultLayout={defaultLayout}
        initialReady={false}
        leftChildren={children}
        rightChildren={rightChildren}
        allowResize={selectedFileViewRenderSecondary}
        hideSplitter={!selectedFileViewRenderSecondary}
        preserveSide={'right'}
        rightPanelMinSize={250}
        rightPanelMaxSize={385}
      />
    </AppPageLayout>
  );
};

FileContainer.displayName = 'FileContainer';
