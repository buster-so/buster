import Link from 'next/link';
import React, { useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/buttons';
import { History, Xmark } from '@/components/ui/icons';
import { Check3 } from '@/components/ui/icons/NucleoIconFilled';
import { AppPageLayout } from '@/components/ui/layouts';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useMemoizedFn, useMount } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { useCloseVersionHistory } from '@/layouts/ChatLayout/FileContainer/FileContainerHeader/FileContainerHeaderVersionHistory';
import { timeFromNow, timeout } from '@/lib';
import { cn } from '@/lib/classMerge';
import { useListVersionHistories } from './useListVersionHistories';

export const VersionHistoryPanel = React.memo(
  ({ assetId, type }: { assetId: string; type: 'metric' | 'dashboard' }) => {
    const chatId = useChatLayoutContextSelector((x) => x.chatId);
    const {
      listItems,
      onPrefetchAsset,
      restoringVersion,
      currentVersionNumber,
      selectedQueryVersion,
      onClickRestoreVersion
    } = useListVersionHistories({
      assetId,
      type
    });
    const { getFileLink } = useGetFileLink();

    const bodyRef = useRef<HTMLDivElement>(null);

    useMount(async () => {
      if (bodyRef.current) {
        await timeout(250);
        const selectedNode = bodyRef.current.querySelector('.selected-version');
        if (selectedNode) {
          selectedNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    return (
      <AppPageLayout
        header={useMemo(() => <PanelHeader />, [assetId, type, chatId])}
        scrollable
        headerBorderVariant="ghost">
        <div ref={bodyRef} className="mx-2 mb-1.5 flex flex-col">
          {listItems?.map((item) => (
            <ListItem
              key={item.version_number}
              {...item}
              onPrefetchAsset={onPrefetchAsset}
              selected={item.version_number === selectedQueryVersion}
              showRestoreButton={item.version_number !== currentVersionNumber}
              onClickRestoreVersion={onClickRestoreVersion}
              restoringVersion={restoringVersion}
              link={
                getFileLink({
                  fileId: assetId,
                  fileType: type,
                  chatId,
                  versionNumber: item.version_number,
                  useVersionHistoryMode: true
                }) || ''
              }
            />
          ))}
        </div>
      </AppPageLayout>
    );
  }
);

const ListItem = React.memo(
  ({
    version_number,
    updated_at,
    selected,
    showRestoreButton,
    link,
    restoringVersion,
    onClickRestoreVersion,
    onPrefetchAsset
  }: {
    version_number: number;
    updated_at: string;
    selected: boolean;
    showRestoreButton: boolean;
    restoringVersion: number | null;
    onClickRestoreVersion: (versionNumber: number) => void;
    onPrefetchAsset: (versionNumber: number, link: string) => Promise<void>;
    link: string;
  }) => {
    const routePrefetchTimeoutRef = useRef<NodeJS.Timeout>();

    const onHoverLink = useMemoizedFn(() => {
      // Prefetch route after 50ms
      routePrefetchTimeoutRef.current = setTimeout(() => {
        onPrefetchAsset(version_number, link);
      }, 125);
    });

    const onHoverEnd = useCallback(() => {
      if (routePrefetchTimeoutRef.current) {
        clearTimeout(routePrefetchTimeoutRef.current);
      }
    }, []);

    const isRestoringVersion = restoringVersion === version_number;

    return (
      <Link prefetch={false} href={link} onMouseEnter={onHoverLink} onMouseLeave={onHoverEnd}>
        <div
          className={cn(
            'group hover:bg-item-hover flex cursor-pointer items-center justify-between space-x-2 rounded px-2.5 py-1.5',
            selected && 'bg-item-select hover:bg-item-select selected-version'
          )}>
          <div className="flex flex-col justify-center space-y-0.5">
            <Text>{`Version ${version_number}`}</Text>
            <Text size={'xs'} variant={'secondary'}>
              {timeFromNow(updated_at, false)}
            </Text>
          </div>

          <div className="text-icon-color animate-in fade-in-0 flex items-center space-x-2 duration-200">
            {showRestoreButton && (
              <AppTooltip title={restoringVersion ? 'Restoring...' : 'Restore version'}>
                <button
                  type="button"
                  onClick={(e) => {
                    if (restoringVersion) return;

                    e.stopPropagation();
                    e.preventDefault();
                    onClickRestoreVersion(version_number);
                  }}
                  className={cn(
                    'hover:bg-gray-light/20 hover:text-foreground -mr-1 rounded p-1 opacity-0 group-hover:block group-hover:opacity-100',
                    isRestoringVersion && 'cursor-not-allowed opacity-100!'
                  )}>
                  {isRestoringVersion ? <CircleSpinnerLoader size={12} /> : <History />}
                </button>
              </AppTooltip>
            )}

            {selected && (
              <div className="group-hover:opacity-100">
                <Check3 />
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }
);
ListItem.displayName = 'ListItem';

const PanelHeader = React.memo(() => {
  const { href } = useCloseVersionHistory();

  return (
    <div className="flex w-full items-center justify-between">
      <Text>Version history</Text>
      <Link href={href} prefetch className="-mr-1.5">
        <Button variant="ghost" prefix={<Xmark />} />
      </Link>
    </div>
  );
});
PanelHeader.displayName = 'PanelHeader';

VersionHistoryPanel.displayName = 'VersionHistoryPanel';
