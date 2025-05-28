'use client';

import { type BusterChatListItem, ShareAssetType } from '@/api/asset_interfaces';
import { FavoriteStar } from '@/components/features/list';
import { getShareStatus } from '@/components/features/metrics/StatusBadgeIndicator';
import { Avatar } from '@/components/ui/avatar';
import type { BusterListColumn, BusterListRow } from '@/components/ui/list';
import { BusterList, ListEmptyStateWithButton } from '@/components/ui/list';
import { useCreateListByDate } from '@/components/ui/list/useCreateListByDate';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { formatDate, makeHumanReadble } from '@/lib';
import { BusterRoutes, createBusterRoute } from '@/routes';
import React, { memo, useMemo, useRef, useState } from 'react';
import { ChatSelectedOptionPopup } from './ChatItemsSelectedPopup';

export const ChatItemsContainer: React.FC<{
  chats: BusterChatListItem[];
  className?: string;
  loading: boolean;
  type: 'logs' | 'chats';
}> = ({ chats = [], className = '', loading, type }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const renderedDates = useRef<Record<string, string>>({});
  const renderedOwners = useRef<Record<string, React.ReactNode>>({});

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });
  const hasSelected = selectedRowKeys.length > 0;

  const logsRecord = useCreateListByDate({ data: chats });

  const getLink = useMemoizedFn((chat: BusterChatListItem) => {
    if (chat.latest_file_id) {
      switch (chat.latest_file_type) {
        case 'metric': {
          const latestVersionNumber = chat.latest_version_number;

          if (latestVersionNumber) {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
              chatId: chat.id,
              metricId: chat.latest_file_id,
              versionNumber: latestVersionNumber
            });
          }

          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            chatId: chat.id,
            metricId: chat.latest_file_id
          });
        }
        case 'dashboard': {
          const latestVersionNumber = chat.latest_version_number;

          if (latestVersionNumber) {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
              chatId: chat.id,
              dashboardId: chat.latest_file_id,
              versionNumber: latestVersionNumber
            });
          }

          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
            chatId: chat.id,
            dashboardId: chat.latest_file_id
          });
        }
        default: {
          const _exhaustiveCheck: never = chat.latest_file_type;
        }
      }
    }

    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: chat.id
    });
  });

  const chatsByDate: BusterListRow[] = useMemo(() => {
    return Object.entries(logsRecord).flatMap(([key, chats]) => {
      const records = chats.map((chat) => ({
        id: chat.id,
        data: chat,
        link: getLink(chat)
      }));
      const hasRecords = records.length > 0;

      if (!hasRecords) return [];

      return [
        {
          id: key,
          data: {},
          rowSection: {
            title: makeHumanReadble(key),
            secondaryTitle: String(records.length)
          }
        },
        ...records
      ];
    });
  }, [logsRecord]);

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        dataIndex: 'name',
        title: 'Name',
        render: (name, record) => <TitleCell name={name} chatId={record?.id} />
      },
      {
        dataIndex: 'last_edited',
        title: 'Last updated',
        width: 132,
        render: (v) => {
          if (renderedDates.current[v]) {
            return renderedDates.current[v];
          }
          const date = formatDate({ date: v, format: 'lll' });
          renderedDates.current[v] = date;
          return date;
        }
      },
      {
        dataIndex: 'is_shared',
        title: 'Sharing',
        width: 65,
        render: (v) => getShareStatus({ is_shared: v })
      },
      {
        dataIndex: 'created_by_name',
        title: 'Owner',
        width: 45,
        render: (name, record) => {
          if (renderedOwners.current[name]) {
            return renderedOwners.current[name];
          }
          const avatarCell = (
            <OwnerCell name={name} image={record?.created_by_avatar || undefined} />
          );
          renderedOwners.current[name] = avatarCell;
          return avatarCell;
        }
      }
    ],
    []
  );

  return (
    <>
      <BusterList
        rows={chatsByDate}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={useMemo(() => <EmptyState loading={loading} type={type} />, [loading, type])}
      />

      <ChatSelectedOptionPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        hasSelected={hasSelected}
      />
    </>
  );
};

const EmptyState: React.FC<{
  loading: boolean;
  type: 'logs' | 'chats';
}> = React.memo(({ loading, type }) => {
  if (loading) return <></>;

  return (
    <ListEmptyStateWithButton
      title={
        type === 'logs'
          ? "You're organization doesn't have any logs yet."
          : "You don't have any chats yet."
      }
      description={
        type === 'logs'
          ? "You don't have any logs... As soon as you do, they will start to appear here."
          : "You don't have any chats. As soon as you do, they will start to appear here."
      }
      buttonText="New chat"
      linkButton={createBusterRoute({ route: BusterRoutes.APP_HOME })}
    />
  );
});
EmptyState.displayName = 'EmptyState';

const TitleCell = React.memo<{ name: string; chatId: string }>(({ name, chatId }) => {
  const onFavoriteDivClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  });

  return (
    <div className="flex w-full items-center space-x-2">
      <Text truncate>{name}</Text>
      <div className="mr-2 flex items-center" onClick={onFavoriteDivClick}>
        <FavoriteStar
          id={chatId}
          type={ShareAssetType.CHAT}
          iconStyle="tertiary"
          title={name}
          className="opacity-0 group-hover:opacity-100"
        />
      </div>
    </div>
  );
});
TitleCell.displayName = 'TitleCell';

const OwnerCell = memo<{ name: string; image: string | undefined }>(({ name, image }) => (
  <div className="flex pl-0">
    <Avatar image={image} name={name} size={18} fallbackClassName="text-2xs" />
  </div>
));
OwnerCell.displayName = 'OwnerCell';
