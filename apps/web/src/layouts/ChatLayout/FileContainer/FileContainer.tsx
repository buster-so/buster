'use client';

import Cookies from 'js-cookie';
import type React from 'react';
import { useMemo, useRef } from 'react';
import { createAutoSaveId } from '@/components/ui/layouts/AppSplitter/helpers';
import { AppSplitter, type AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { useDebounce, useMemoizedFn, useUpdateLayoutEffect } from '@/hooks';
import { useChatLayoutContextSelector } from '../ChatLayoutContext';
import { FileContainerHeader } from './FileContainerHeader';
import { FileContainerSecondary } from './FileContainerSecondary';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { FileContainerVersionHistorySecondary } from './FileContainerHeader/FileContainerHeaderVersionHistory/FileContainerVersionHistorySecondary';

interface FileContainerProps {
  children: React.ReactNode;
}

const defaultOpenLayout: [string, string] = ['auto', '310px'];
const defaulClosedLayout: [string, string] = ['auto', '0px'];
const autoSaveId = 'file-container-splitter';

export const FileContainer: React.FC<FileContainerProps> = ({ children }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);
  const selectedFile = useChatLayoutContextSelector((x) => x.selectedFile);
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
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
    if (!debouncedSelectedFileViewSecondary) {
      return null;
    }
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

  const bustStorageOnInit = useMemoizedFn((layout: number | null) => {
    if (selectedFileViewRenderSecondary && !layout) {
      return true;
    }
    return !debouncedSelectedFileViewSecondary;
  });

  return (
    <AppPageLayout
      headerSizeVariant="default"
      className="flex h-full min-w-[380px] flex-col"
      header={useMemo(
        () => (
          <FileContainerHeader isVersionHistoryMode={isVersionHistoryMode} />
        ),
        [isVersionHistoryMode]
      )}
      secondaryHeader={useMemo(
        () => isVersionHistoryMode && <FileContainerVersionHistorySecondary />,
        [isVersionHistoryMode]
      )}>
      <AppSplitter
        ref={appSplitterRef}
        autoSaveId={autoSaveId}
        defaultLayout={defaultLayout}
        leftChildren={children}
        rightChildren={rightChildren}
        allowResize={selectedFileViewRenderSecondary}
        hideSplitter={!selectedFileViewRenderSecondary}
        preserveSide={'right'}
        rightPanelMinSize={260}
        rightPanelMaxSize={385}
        bustStorageOnInit={bustStorageOnInit}
      />
    </AppPageLayout>
  );
};

FileContainer.displayName = 'FileContainer';
