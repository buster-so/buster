'use client';

import React, { PropsWithChildren } from 'react';
import { Button, PopoverProps, Divider, Input } from 'antd';
import { AppPopover } from '@/components/tooltip/AppPopover';
import { AppMaterialIcons, AppTooltip } from '@/components';
import { useMemoizedFn } from 'ahooks';
import { inputHasText } from '@/utils';
import { validate } from 'email-validator';
import { ShareWithGroupAndTeam } from './ShareWithTeamAndGroup';
import { ShareMenuTopBar, ShareMenuTopBarOptions } from './ShareMenuTopBar';
import { CircleButton } from './CircleButton';
import { useStyles } from './useStyles';
import { IndividualSharePerson } from './IndividualSharePerson';
import { ShareMenuContentPublish } from './ShareMenuContentPublish';
import { ShareMenuContentEmbed } from './ShareMenuContentEmbed';
import { IBusterThread } from '@/context/Threads/interfaces';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { BusterDashboardResponse, BusterShare, BusterShareAssetType } from '@/api/buster-rest';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { AccessDropdown } from './AccessDropdown';
import { ShareRole } from '@/api/buster-socket/threads';
import { ShareRequest } from '@/api/buster-socket/dashboards';
import { BusterCollection } from '@/api/buster-rest/collection';
import { useCollectionsContextSelector } from '@/context/Collections';
import { Text } from '@/components';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useUserConfigContextSelector } from '@/context/Users';

export const ShareMenu: React.FC<
  PropsWithChildren<{
    placement?: PopoverProps['placement'];
    thread?: IBusterThread;
    dashboardResponse?: BusterDashboardResponse;
    collection?: BusterCollection;
    shareType: BusterShareAssetType;
  }>
> = ({ children, dashboardResponse, collection, thread, shareType, placement = 'bottomLeft' }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const isPublic =
    thread?.publicly_accessible ||
    dashboardResponse?.dashboard.publicly_accessible ||
    collection?.publicly_accessible;

  const permission = thread?.permission || dashboardResponse?.permission || collection?.permission!;

  const showShareMenu = permission === ShareRole.OWNER;

  const onOpenChange = useMemoizedFn((v: boolean) => {
    setIsOpen(v);
  });

  if (!showShareMenu) {
    return null;
  }

  return (
    <AppPopover
      trigger={['click']}
      destroyTooltipOnHide
      placement={placement}
      onOpenChange={onOpenChange}
      content={
        <ShareMenuContent
          thread={thread}
          collection={collection}
          dashboardResponse={dashboardResponse}
          shareType={shareType}
          permission={permission}
        />
      }>
      <AppTooltip title={!isOpen ? 'Share item' : ''}>{children}</AppTooltip>
    </AppPopover>
  );
};

const ShareMenuContent: React.FC<{
  thread?: IBusterThread;
  dashboardResponse?: BusterDashboardResponse;
  collection?: BusterCollection;
  shareType: BusterShareAssetType;
  permission: ShareRole;
}> = React.memo(({ collection, thread, dashboardResponse, shareType, permission }) => {
  const { openSuccessMessage } = useBusterNotifications();

  const isOwner = permission === ShareRole.OWNER;
  const [selectedOptions, setSelectedOptions] = React.useState<ShareMenuTopBarOptions>(
    isOwner ? ShareMenuTopBarOptions.Share : ShareMenuTopBarOptions.Embed
  );
  const previousSelection = React.useRef<ShareMenuTopBarOptions>(selectedOptions);
  const showShareMenuTopBar =
    isOwner && selectedOptions !== ShareMenuTopBarOptions.ShareWithGroupAndTeam;

  const onCopyLink = useMemoizedFn(() => {
    let url = '';
    if (shareType === BusterShareAssetType.THREAD && thread) {
      url = createBusterRoute({ route: BusterRoutes.APP_THREAD_ID, threadId: thread.id });
    } else if (shareType === 'dashboard' && dashboardResponse) {
      url = createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: dashboardResponse.dashboard.id
      });
    } else if (shareType === 'collection' && collection) {
      url = createBusterRoute({
        route: BusterRoutes.APP_COLLECTIONS_ID,
        collectionId: collection.id
      });
    }
    const urlWithDomain = window.location.origin + url;
    navigator.clipboard.writeText(urlWithDomain);
    openSuccessMessage('Link copied to clipboard');
  });

  const onChangeSelectedOption = useMemoizedFn((option: ShareMenuTopBarOptions) => {
    setSelectedOptions(option);
  });

  const setOpenShareWithGroupAndTeam = useMemoizedFn((open: boolean) => {
    previousSelection.current = selectedOptions;
    setSelectedOptions(ShareMenuTopBarOptions.ShareWithGroupAndTeam);
  });

  const goBack = useMemoizedFn(() => {
    setSelectedOptions(previousSelection.current);
  });

  return (
    <div className="min-w-[320px]">
      {showShareMenuTopBar && (
        <>
          <ShareMenuTopBar
            shareType={shareType}
            selectedOptions={selectedOptions}
            onChangeSelectedOption={onChangeSelectedOption}
            onCopyLink={onCopyLink}
            permission={permission}
          />
          <Divider />
        </>
      )}

      <ShareMenuContentBody
        thread={thread}
        dashboardResponse={dashboardResponse}
        collection={collection}
        shareType={shareType}
        selectedOptions={selectedOptions}
        setOpenShareWithGroupAndTeam={setOpenShareWithGroupAndTeam}
        goBack={goBack}
        onCopyLink={onCopyLink}
      />
    </div>
  );
});
ShareMenuContent.displayName = 'ShareMenuContent';

const ShareMenuContentBody: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  setOpenShareWithGroupAndTeam: (open: boolean) => void;
  goBack: () => void;
  onCopyLink: () => void;
  thread?: IBusterThread;
  dashboardResponse?: BusterDashboardResponse;
  collection?: BusterCollection;
  shareType: BusterShareAssetType;
}> = React.memo(
  ({
    shareType,
    onCopyLink,
    collection,
    thread,
    dashboardResponse,
    selectedOptions,
    goBack,
    setOpenShareWithGroupAndTeam
  }) => {
    const Component = ContentRecord[selectedOptions];

    const selectedClass = selectedOptions === ShareMenuTopBarOptions.Share ? 'pt-3' : '';
    const individual_permissions =
      thread?.individual_permissions ||
      dashboardResponse?.individual_permissions ||
      collection?.individual_permissions;
    const team_permissions =
      thread?.team_permissions ||
      dashboardResponse?.team_permissions ||
      collection?.team_permissions ||
      [];
    const organization_permissions =
      thread?.organization_permissions ||
      dashboardResponse?.organization_permissions ||
      collection?.organization_permissions ||
      [];
    const publicly_accessible =
      thread?.publicly_accessible ??
      dashboardResponse?.dashboard.publicly_accessible ??
      collection?.publicly_accessible ??
      false;
    const publicExpirationDate =
      thread?.public_expiry_date ??
      dashboardResponse?.dashboard.public_expiry_date ??
      collection?.public_expiry_date ??
      null;
    const password =
      thread?.public_password ??
      dashboardResponse?.public_password ??
      collection?.public_password ??
      null;

    const id = thread?.id || dashboardResponse?.dashboard?.id || collection?.id || '';

    return (
      <div className={selectedClass}>
        <Component
          setOpenShareWithGroupAndTeam={setOpenShareWithGroupAndTeam}
          goBack={goBack}
          onCopyLink={onCopyLink}
          individual_permissions={individual_permissions}
          team_permissions={team_permissions}
          organization_permissions={organization_permissions}
          shareType={shareType}
          publicly_accessible={publicly_accessible}
          publicExpirationDate={publicExpirationDate}
          password={password}
          threadId={thread?.id}
          dashboardId={dashboardResponse?.dashboard?.id}
          collectionId={collection?.id}
        />
      </div>
    );
  }
);
ShareMenuContentBody.displayName = 'ShareMenuContentBody';

const ShareMenuContentShare: React.FC<{
  setOpenShareWithGroupAndTeam: (open: boolean) => void;
  individual_permissions: BusterShare['individual_permissions'];
  shareType: 'thread' | 'dashboard';
  threadId?: string;
  dashboardId?: string;
  collectionId?: string;
}> = React.memo(
  ({
    setOpenShareWithGroupAndTeam,
    shareType,
    individual_permissions,
    threadId,
    dashboardId,
    collectionId
  }) => {
    const userTeams = useUserConfigContextSelector((state) => state.userTeams);
    const onShareThread = useBusterThreadsContextSelector((state) => state.onShareThread);
    const onShareDashboard = useDashboardContextSelector((state) => state.onShareDashboard);
    const onShareCollection = useCollectionsContextSelector((state) => state.onShareCollection);
    const [inputValue, setInputValue] = React.useState<string>('');
    const [isInviting, setIsInviting] = React.useState<boolean>(false);
    const [defaultPermissionLevel, setDefaultPermissionLevel] = React.useState<ShareRole>(
      ShareRole.VIEWER
    );
    const disableSubmit = !inputHasText(inputValue) || !validate(inputValue);
    const id = threadId || dashboardId || collectionId || '';
    const hasUserTeams = userTeams.length > 0;

    const onSubmitNewEmail = useMemoizedFn(async () => {
      const isValidEmail = validate(inputValue);
      if (!isValidEmail) {
        alert('Invalid email address');
        return;
      }

      const payload = {
        id,
        user_permissions: [
          {
            user_email: inputValue,
            role: defaultPermissionLevel
          }
        ]
      };

      setIsInviting(true);
      if (shareType === 'thread') {
        await onShareThread(payload);
      } else if (shareType === 'dashboard') {
        await onShareDashboard(payload);
      } else if (shareType === 'collection') {
        await onShareCollection(payload);
      }
      setIsInviting(false);
      setInputValue('');
    });

    const onUpdateShareRole = useMemoizedFn(
      async (userId: string, email: string, role: ShareRole | null) => {
        let payload: ShareRequest = { id };

        if (!role) {
          payload.remove_users = [userId];
        } else {
          payload.user_permissions = [
            {
              user_email: email,
              role
            }
          ];
        }
        if (shareType === 'thread') {
          await onShareThread(payload);
        } else if (shareType === 'dashboard') {
          await onShareDashboard(payload);
        } else if (shareType === 'collection') {
          await onShareCollection(payload);
        }
      }
    );

    const onChangeInputValue = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    });

    const onChangeAccessDropdown = useMemoizedFn((level: ShareRole | null) => {
      level && setDefaultPermissionLevel(level);
    });

    const onOpenShareWithGroupAndTeam = useMemoizedFn(() => {
      setOpenShareWithGroupAndTeam(true);
    });

    return (
      <div className="flex flex-col">
        <div className="flex h-full items-center space-x-2 px-3">
          <div className="relative flex w-full items-center">
            <Input
              className="w-full"
              placeholder="Invite others by email..."
              value={inputValue}
              onChange={onChangeInputValue}
              onPressEnter={onSubmitNewEmail}
            />

            {inputValue && (
              <AccessDropdown
                showRemove={false}
                groupShare={false}
                className="absolute right-[10px]"
                shareLevel={defaultPermissionLevel}
                onChangeShareLevel={onChangeAccessDropdown}
              />
            )}
          </div>
          <Button loading={isInviting} onClick={onSubmitNewEmail} disabled={disableSubmit}>
            Invite
          </Button>
        </div>

        <div className="my-1 px-3">
          {individual_permissions?.map((permission) => (
            <IndividualSharePerson
              key={permission.id}
              {...permission}
              shareType={shareType}
              onUpdateShareRole={onUpdateShareRole}
            />
          ))}
        </div>

        <Divider />

        {hasUserTeams && (
          <ShareWithGroupAndTeamOption onOpenShareWithGroupAndTeam={onOpenShareWithGroupAndTeam} />
        )}
      </div>
    );
  }
);
ShareMenuContentShare.displayName = 'ShareMenuContentShare';

const ShareWithGroupAndTeamOption: React.FC<{
  onOpenShareWithGroupAndTeam: () => void;
}> = React.memo(({ onOpenShareWithGroupAndTeam }) => {
  const { styles, cx } = useStyles();

  return (
    <div
      onClick={onOpenShareWithGroupAndTeam}
      className={cx(
        'flex cursor-pointer items-center space-x-1.5 px-3 py-2',
        styles.hoverListItem
      )}>
      <CircleButton>
        <AppMaterialIcons icon="groups_2" size={14} />
      </CircleButton>
      <div className={cx('flex w-full items-center justify-between space-x-1.5')}>
        <Text>Share with groups & teams</Text>
        <AppMaterialIcons icon="chevron_right" />
      </div>
    </div>
  );
});
ShareWithGroupAndTeamOption.displayName = 'ShareWithGroupAndTeamOption';

const ContentRecord: Record<ShareMenuTopBarOptions, React.FC<any>> = {
  Share: ShareMenuContentShare,
  Publish: ShareMenuContentPublish,
  Embed: ShareMenuContentEmbed,
  ShareWithGroupAndTeam: ShareWithGroupAndTeam
};
