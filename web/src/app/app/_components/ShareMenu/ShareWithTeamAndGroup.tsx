import React, { useMemo } from 'react';
import { CopyLinkButton } from './CopyLinkButton';
import { Button, Divider } from 'antd';
import { AppMaterialIcons, BackButton } from '@/components';
import { useStyles } from './useStyles';
import { AccessDropdown } from './AccessDropdown';
import { useUserConfigContextSelector } from '@/context/Users';
import { ShareRole } from '@/api/buster_socket/threads';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { useDashboardContextSelector, useIndividualDashboard } from '@/context/Dashboards';
import { ShareRequest } from '@/api/buster_socket/dashboards';
import { useMemoizedFn } from 'ahooks';
import { useCollectionsContextSelector, useIndividualCollection } from '@/context/Collections';
import { Text } from '@/components';

export const ShareWithGroupAndTeam: React.FC<{
  goBack: () => void;
  onCopyLink: () => void;
  shareType: 'thread' | 'dashboard' | 'collection';
  threadId?: string;
  dashboardId?: string;
  collectionId?: string;
}> = ({ shareType, goBack, onCopyLink, threadId, dashboardId, collectionId }) => {
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const loadedUserTeams = useUserConfigContextSelector((state) => state.loadedUserTeams);
  const onShareThread = useBusterThreadsContextSelector((state) => state.onShareThread);
  const getThread = useBusterThreadsContextSelector(
    (state) => state.getThreadNotLiveDataMethodOnly
  );
  const onShareDashboard = useDashboardContextSelector((state) => state.onShareDashboard);
  const onShareCollection = useCollectionsContextSelector((state) => state.onShareCollection);

  const { dashboardResponse } = useIndividualDashboard({ dashboardId });
  const { collection } = useIndividualCollection({ collectionId });

  const thread = useMemo(
    () => (shareType === 'thread' && threadId ? getThread({ threadId }) : null),
    [shareType, threadId]
  );

  const onUpdateShareRole = useMemoizedFn(
    async ({ teamId, role }: { teamId: string; role: ShareRole | null }) => {
      const id = threadId || dashboardId || collectionId || '';
      let payload: ShareRequest = { id };
      if (!role) {
        payload.remove_teams = [teamId];
      } else {
        payload.team_permissions = [{ team_id: teamId, role }];
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

  const listedTeam: { id: string; name: string; role: ShareRole | null }[] = useMemo(() => {
    const assosciatedPermissiongSearch = (teamId: string) => {
      if (shareType === 'thread' && thread) {
        return thread.team_permissions?.find((t) => t.id === teamId);
      } else if (shareType === 'dashboard' && dashboardResponse) {
        return dashboardResponse.team_permissions?.find((t) => t.id === teamId);
      } else if (shareType === 'collection' && collection) {
        return collection.team_permissions?.find((t) => t.id === teamId);
      }
    };
    return userTeams.reduce<{ id: string; name: string; role: ShareRole | null }[]>((acc, team) => {
      const assosciatedPermission = assosciatedPermissiongSearch(team.id);
      acc.push({
        id: team.id,
        name: team.name,
        role: assosciatedPermission?.role || null
      });

      return acc;
    }, []);
  }, [
    userTeams,
    dashboardResponse,
    thread,
    threadId,
    dashboardId,
    collection,
    collectionId,
    shareType
  ]);

  const stuffToShow = listedTeam.length > 0 || userTeams.length === 0;

  return (
    <div className="">
      <div className="flex h-[40px] items-center justify-between space-x-1 px-3">
        <BackButton onClick={goBack} />
        <div>
          <CopyLinkButton onCopyLink={onCopyLink} />
        </div>
      </div>

      <Divider />

      <div className="">
        {listedTeam.map((team) => (
          <ShareOption
            key={team.id}
            title={userTeams.length > 1 ? team.name : 'Your team'}
            role={team.role}
            onUpdateShareRole={(role) => {
              onUpdateShareRole({
                teamId: team.id,
                role
              });
            }}
          />
        ))}

        {userTeams.length === 0 && !loadedUserTeams && (
          <div className="flex w-full items-center justify-center p-3">
            <Text type="secondary">
              {loadedUserTeams ? 'Not currently a member of any teams' : 'Loading teams...'}
            </Text>
          </div>
        )}

        {!stuffToShow && (
          <div className="flex w-full items-center justify-center p-3">
            <Text type="secondary">No teams to share with</Text>
          </div>
        )}
      </div>
    </div>
  );
};

const ShareOption: React.FC<{
  title: string;
  onUpdateShareRole: (role: ShareRole | null) => void;
  role: ShareRole | null;
}> = ({ onUpdateShareRole, title, role }) => {
  const { cx } = useStyles();

  return (
    <div
      className={cx(
        'flex h-[40px] cursor-pointer items-center justify-between space-x-2 px-3'
        //   styles.hoverListItem
      )}>
      <div className="flex items-center space-x-2">
        <Button shape="circle" icon={<AppMaterialIcons icon={'groups_2'} size={14} />} />

        <Text>{title}</Text>
      </div>

      <div>
        <AccessDropdown
          groupShare
          shareLevel={role}
          onChangeShareLevel={(v) => {
            onUpdateShareRole(v);
          }}
        />
      </div>
    </div>
  );
};
