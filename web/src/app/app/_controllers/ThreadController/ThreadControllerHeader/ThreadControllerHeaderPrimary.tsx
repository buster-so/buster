'use client';

import { BusterRoutes, createBusterRoute } from '@/routes';
import { Breadcrumb, Button, Divider, Dropdown, MenuProps, Skeleton } from 'antd';
import Link from 'next/link';
import React, { useEffect, useMemo } from 'react';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import {
  useBusterThreadIndividual,
  useBusterThreadMessage,
  useBusterThreads,
  useBusterThreadsContextSelector
} from '@/context/Threads';
import { BreadcrumbSeperator } from '@/styles/context/useBreadcrumbStyles';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { SaveToDashboardButton } from './SaveToDashboardButton';
import {
  AppMaterialIcons,
  AppTooltip,
  BusterUserAvatarGroup,
  BusterUserAvatarProps,
  PreventNavigation
} from '@/components';
import { useUserConfigContextSelector } from '@/context/Users';
import { BusterShareAssetType } from '@/api/busterv2';
import { useMemoizedFn, useMount } from 'ahooks';
import { BusterMessageData, IBusterThreadMessage } from '@/context/Threads/interfaces';
import { useDisableSaveChanges } from './useDisableSaveChanges';
import { useCollectionsContextSelector } from '@/context/Collections';
import { exportJSONToCSV } from '@/utils/exportUtils';
import { ShareRole } from '@/api/buster-socket/threads';
import { ShareMenu } from '@/app/app/_components/ShareMenu';
import { FavoriteStar } from '@/app/app/_components/Lists/FavoriteStar';
import { StatusBadgeButton } from '@/app/app/_components/Lists';
import { ConfidenceScoreButton, SaveToCollectionsButton } from '@/app/app/_components/Buttons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { createStyles } from 'antd-style';
import { useBusterMessageDataContextSelector } from '@/context/MessageData';
import { generateChartDownloadImage } from '@/utils/imageGeneration';
import { timeout } from '@/utils';
import { useSQLContextSelector } from '@/context/SQL/useSQLProvider';

export const ThreadControllerHeaderPrimary: React.FC<{
  threadId: string;
  dashboardId?: string;
  collectionId?: string;
}> = ({ threadId, dashboardId, collectionId }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const user = useUserConfigContextSelector((state) => state.user);
  const resetTrigger = useSQLContextSelector((x) => x.resetTrigger);
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const onSaveThreadChanges = useBusterThreadsContextSelector((x) => x.onSaveThreadChanges);
  const resetThread = useBusterThreadsContextSelector((x) => x.resetThread);
  const setEditingThreadTitle = useBusterThreadsContextSelector((x) => x.setEditingThreadTitle);
  const deleteThread = useBusterThreadsContextSelector((x) => x.deleteThread);
  const resetDashboardMetric = useDashboardContextSelector((state) => state.resetDashboardMetric);
  const { thread } = useBusterThreadIndividual({ threadId });
  const { message: currentThreadMessage } = useBusterThreadMessage({ threadId });
  const currentMessageData = useBusterMessageDataContextSelector(({ getMessageData }) =>
    getMessageData(currentThreadMessage?.id!)
  );

  const isReadyOnly = thread?.permission === ShareRole.VIEWER || isAnonymousUser;
  const hasUser = !!user?.id;
  const threadTitle = currentThreadMessage?.title || thread.title;

  const {
    showSaveButton,
    resetInitialThreadMessage,
    renderPreventNavigation,
    disableSaveChangesButton
  } = useDisableSaveChanges({
    currentThreadMessage,
    thread
  });

  const disableButtons = !currentThreadMessage?.isCompleted;

  const onSaveChanges = useMemoizedFn(async () => {
    await onSaveThreadChanges({
      threadId,
      save_draft: true,
      save_as_thread_state: currentThreadMessage?.id
    });
    resetInitialThreadMessage();
    resetDashboardMetric({ threadId: threadId });
    openSuccessMessage('Changes saved');
  });

  const onDiscardChanges = useMemoizedFn(async () => {
    setTimeout(() => {
      resetThread({ threadId });
    }, 450);
  });

  const avatars: BusterUserAvatarProps[] = useMemo(() => {
    return hasUser
      ? [
          {
            name: user.name || user.email,
            image: undefined
          }
        ]
      : [];
  }, [hasUser, user]);

  const items = useMemo(() => {
    return [
      {
        title: <ThreadPrimaryBreadcrumb dashboardId={dashboardId} collectionId={collectionId} />
      },
      {
        title: threadTitle
      }
    ].filter((item) => item.title);
  }, [threadTitle, dashboardId, collectionId]);

  const onDownloadChartClick = useMemoizedFn(() => {
    //this is a render blocking call, so we need to delay it
    timeout(300).then(() => {
      if (!currentThreadMessage || !currentMessageData.data) return;
      generateChartDownloadImage(currentThreadMessage, currentMessageData.data);
    });
  });

  useEffect(() => {
    resetInitialThreadMessage();
  }, [resetTrigger]);

  return (
    <div className="flex h-full w-full items-center justify-between space-x-3">
      <div className="flex h-full items-center space-x-1 overflow-hidden">
        <Breadcrumb items={items} separator={<BreadcrumbSeperator />} />

        {currentThreadMessage && (
          <div className="flex items-center space-x-0">
            <ThreeDotDropdown
              messageData={currentMessageData.data}
              messageTitle={currentThreadMessage?.title || ''}
              threadId={threadId}
              setEditingThreadTitle={setEditingThreadTitle}
              deleteThread={deleteThread}
              messageId={currentThreadMessage?.id!}
              onDownloadChartClick={onDownloadChartClick}
              isTable={
                currentThreadMessage?.chart_config?.selectedChartType === 'table' ||
                currentThreadMessage?.chart_config?.selectedView === 'table'
              }
            />

            <FavoriteStar
              type={BusterShareAssetType.THREAD}
              id={threadId}
              name={currentThreadMessage?.title || thread.title}
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1.5">
        {hasUser && (
          <div className="flex items-center space-x-3">
            <BusterUserAvatarGroup size={24} avatars={avatars} />

            <Divider className="min-h-5" type="vertical" />
          </div>
        )}

        {currentThreadMessage && (
          <ConfidenceScoreButton
            evaluation_score={currentThreadMessage.evaluation_score}
            evaluation_summary={currentThreadMessage.evaluation_summary}
            loading={!currentThreadMessage.isCompleted}
            disabled={disableButtons}
          />
        )}

        {!isReadyOnly && (
          <StatusBadgeButton
            status={currentThreadMessage?.status!}
            type="thread"
            id={thread?.id!}
            disabled={disableButtons}
          />
        )}

        <SaveToDashboardButton
          threadId={threadId}
          selectedDashboards={thread?.dashboards || []}
          disabled={disableButtons}
        />

        <SaveToCollectionsButton
          threadId={threadId}
          selectedCollections={thread?.collections || []}
          disabled={disableButtons}
        />

        <ShareMenu shareType={BusterShareAssetType.THREAD} thread={thread}>
          <Button
            disabled={disableButtons}
            type="text"
            icon={<AppMaterialIcons icon="share_windows" />}
          />
        </ShareMenu>

        {showSaveButton && (
          <SaveChangesButton
            disableSaveChangesButton={!!disableSaveChangesButton}
            onSaveChanges={onSaveChanges}
            onDiscardChanges={onDiscardChanges}
            renderPreventNavigation={renderPreventNavigation}
          />
        )}
      </div>
    </div>
  );
};

const ThreadPrimaryBreadcrumb: React.FC<{
  dashboardId?: string;
  collectionId?: string;
}> = ({ dashboardId, collectionId }) => {
  const getDashboardFromList = useDashboardContextSelector((state) => state.getDashboardFromList);
  const getInitialCollections = useCollectionsContextSelector(
    (state) => state.getInitialCollections
  );
  const getCollectionFromList = useCollectionsContextSelector(
    (state) => state.getCollectionFromList
  );

  const href = useMemo(() => {
    return collectionId
      ? createBusterRoute({
          route: BusterRoutes.APP_COLLECTIONS_ID,
          collectionId
        })
      : dashboardId
        ? createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId })
        : createBusterRoute({ route: BusterRoutes.APP_THREAD });
  }, [collectionId, dashboardId]);

  const linkText = useMemo(() => {
    return collectionId
      ? getCollectionFromList(collectionId)?.name
      : dashboardId
        ? getDashboardFromList(dashboardId)?.name
        : 'Metrics';
  }, [collectionId, dashboardId]);

  useMount(() => {
    getInitialCollections();
  });

  return (
    <Link suppressHydrationWarning className={`truncate`} href={href}>
      {linkText}
    </Link>
  );
};

const SaveChangesButton: React.FC<{
  disableSaveChangesButton: boolean;
  onSaveChanges: () => Promise<void>;
  onDiscardChanges: () => Promise<void>;
  renderPreventNavigation?: boolean;
}> = React.memo(
  ({ onSaveChanges, onDiscardChanges, renderPreventNavigation, disableSaveChangesButton }) => {
    return (
      <>
        <div className="!ml-2 flex items-center space-x-3.5">
          <div className="">
            <Divider className="!mx-0 min-h-5" type="vertical" />
          </div>

          <AppTooltip>
            <Button disabled={disableSaveChangesButton} type="primary" onClick={onSaveChanges}>
              Save changes
            </Button>
          </AppTooltip>
        </div>

        {renderPreventNavigation && (
          <PreventNavigation
            isDirty={true}
            onCancel={onDiscardChanges}
            onOk={onSaveChanges}
            title="Would you like to save changes to this metric?"
            description="You are about to leave this page without saving changes. Would you like to save your changes before you leave?"
          />
        )}
      </>
    );
  }
);
SaveChangesButton.displayName = 'SaveChangesButton';

const useStyles = createStyles(({ css, token }) => {
  return {
    icon: css`
      color: ${token.colorIcon};
    `
  };
});

const ThreeDotDropdown: React.FC<{
  threadId: string;
  messageTitle: IBusterThreadMessage['title'];
  messageData: BusterMessageData['data'];
  messageId: string;
  setEditingThreadTitle: (value: boolean) => void;
  deleteThread: ReturnType<typeof useBusterThreads>['deleteThread'];
  onDownloadChartClick: () => void;
  isTable: boolean;
}> = React.memo(
  ({
    threadId,
    messageData,
    messageTitle,
    setEditingThreadTitle,
    messageId,
    deleteThread,
    onDownloadChartClick,
    isTable
  }) => {
    const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
    const { styles, cx } = useStyles();

    const items: MenuProps['items'] = useMemo(
      () =>
        [
          {
            key: 'edit',
            label: 'Edit name',
            icon: <AppMaterialIcons icon="edit" />,
            onClick: () => {
              setEditingThreadTitle(true);
            }
          },
          {
            key: 'delete',
            label: 'Delete metric',
            icon: <AppMaterialIcons icon="delete" />,
            onClick: async () => {
              await deleteThread({
                threadIds: [threadId]
              });
              onChangePage({ route: BusterRoutes.APP_THREAD });
            }
          },
          {
            key: 'export',
            label: 'Export data as CSV',
            icon: <AppMaterialIcons icon="download" />,
            onClick: () => {
              const name = messageTitle || 'export';
              exportJSONToCSV(messageData || [], name);
            },
            disabled: !messageData
          },
          // {
          //   key: 'export-pdf',
          //   label: 'Export data as PDF',
          //   icon: <AppMaterialIcons icon="picture_as_pdf" />,
          //   onClick: () => {
          //     const name = messageTitle || 'export';
          //     exportJSONToPDF(messageData || [], `${name}.pdf`);
          //   }
          // },
          {
            key: 'download-chart',
            label: 'Download chart',
            icon: <AppMaterialIcons icon="download" />,
            onClick: onDownloadChartClick,
            disabled: !messageData,
            hidden: isTable
          }
        ].filter((item) => !item.hidden),
      [messageTitle, onDownloadChartClick, messageData, messageId]
    );

    const memoizedMenu = useMemo(() => {
      return { items };
    }, [items]);

    return (
      <Dropdown trigger={['click']} menu={memoizedMenu} destroyPopupOnHide>
        <Button
          type="text"
          icon={
            <AppMaterialIcons className={cx(styles.icon, 'cursor-pointer')} icon="more_horiz" />
          }
        />
      </Dropdown>
    );
  }
);
ThreeDotDropdown.displayName = 'ThreeDotDropdown';
