import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useRef, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import {
  BusterPermissionGroup,
  BusterPermissionTeam,
  BusterPermissionUser
} from '@/api/buster-rest/permissions';
import {
  PermissionGroupUpdateRequest,
  PermissionTeamUpdateRequest,
  PermissionUserUpdateRequest
} from '@/api/buster-socket/permissions';
import { usePermissionUsers } from './usePermissionsUsers';
import { usePermissionsTeams } from './usePermissionsTeams';
import { usePermissionsGroups } from './usePermissionsGroups';
import { usePermissionDatasets } from './usePermissionDatasets';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';

export const usePermissions = () => {
  const busterSocket = useBusterWebSocket();

  //INDIVIDUAL PERMISSIONS USERS
  const [users, setUsers] = React.useState<Record<string, BusterPermissionUser>>({});
  const subscribedUsers = useRef<Record<string, boolean>>({});

  const _onGetUser = useMemoizedFn((user: BusterPermissionUser) => {
    setUsers((prev) => ({ ...prev, [user.id]: user }));
  });

  const subscribeToUser = useMemoizedFn(async (userId: string) => {
    const res = await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/permissions/users/get',
        payload: {
          id: userId
        }
      },
      responseEvent: {
        route: '/permissions/users/get:getUserPermissions',
        callback: _onGetUser
      }
    });
    subscribedUsers.current[userId] = true;
    return res;
  });

  const updateUser = useMemoizedFn((params: PermissionUserUpdateRequest['payload']) => {
    setUsers((prev) => {
      const p = prev[params.id]!;
      return {
        ...prev,
        [params.id]: {
          ...p!,
          sharing_setting: params.sharing_setting || p.sharing_setting!,
          upload_csv: params.upload_csv || p.upload_csv!,
          edit_sql: params.edit_sql || p.edit_sql!,
          export_assets: params.export_assets || p.export_assets!,
          email_slack_enabled: params.email_slack_enabled || p.email_slack_enabled!
        }
      };
    });
    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/permissions/users/update',
        payload: params
      },
      responseEvent: {
        route: '/permissions/users/update:updateUserPermission',
        callback: _onGetUser
      }
    });
  });

  const unsubscribeFromUser = useMemoizedFn((userId: string) => {
    subscribedUsers.current[userId] = false;
  });

  //PERMISSION GROUP LIST

  const [permissionGroups, setPermissionGroups] = useState<Record<string, BusterPermissionGroup>>(
    {}
  );
  const permissionGroupsSubscribed = useRef<Record<string, boolean>>({});

  const _getIndividualPermissionGroup = useMemoizedFn((group: BusterPermissionGroup) => {
    setPermissionGroups((prev) => ({ ...prev, [group.id]: group }));
  });

  const updatePermissionGroup = useMemoizedFn(
    async (payload: PermissionGroupUpdateRequest['payload']) => {
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/permissions/groups/update',
          payload
        },
        responseEvent: {
          route: '/permissions/groups/update:updatePermissionGroup',
          callback: _getIndividualPermissionGroup
        }
      });
    }
  );

  const subscribeToPermissionGroup = useMemoizedFn((groupId: string) => {
    let selectedPermissionGroup = permissionGroups[groupId];

    if (!selectedPermissionGroup && !permissionGroupsSubscribed.current[groupId]) {
      permissionGroupsSubscribed.current[groupId] = true;
      busterSocket.emitAndOnce({
        emitEvent: {
          route: '/permissions/groups/get',
          payload: {
            id: groupId
          }
        },
        responseEvent: {
          route: '/permissions/groups/get:getPermissionGroup',
          callback: _getIndividualPermissionGroup
        }
      });
    }

    return selectedPermissionGroup;
  });

  const unsubscribeFromPermissionGroup = useMemoizedFn((groupId: string) => {
    permissionGroupsSubscribed.current[groupId] = false;
  });

  const createPermissionGroup = useMemoizedFn(
    async ({ name }: { name: string; description?: string }) => {
      const postRes = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/permissions/groups/post',
          payload: {
            name
          }
        },
        responseEvent: {
          route: '/permissions/groups/post:postPermissionGroup',
          callback: (v) => v
        }
      });

      return postRes as BusterPermissionGroup;
    }
  );

  //PERMISSION TEAM LIST
  const [teams, setTeams] = useState<Record<string, BusterPermissionTeam>>({});
  const subscribedTeams = useRef<Record<string, boolean>>({});

  const _setIndividualTeam = useMemoizedFn((team: BusterPermissionTeam) => {
    setTeams((prev) => ({ ...prev, [team.id]: team }));
  });

  const subscribeToTeam = useMemoizedFn(async (teamId: string) => {
    const res = await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/permissions/teams/get',
        payload: {
          id: teamId
        }
      },
      responseEvent: {
        route: '/permissions/teams/get:getTeamPermissions',
        callback: _setIndividualTeam
      }
    });
    return res;
  });

  const unsubscribeTeam = useMemoizedFn((teamId: string) => {
    subscribedTeams.current[teamId] = false;
  });

  const updateTeam = useMemoizedFn(async (payload: PermissionTeamUpdateRequest['payload']) => {
    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/permissions/teams/update',
        payload
      },
      responseEvent: {
        route: '/permissions/teams/update:updateTeamPermission',
        callback: _setIndividualTeam
      }
    });
  });

  const createNewTeam = useMemoizedFn(async (team: { name: string; description: string }) => {
    const res = await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/permissions/teams/post',
        payload: { ...team }
      },
      responseEvent: {
        route: '/permissions/teams/post:postTeam',
        callback: _setIndividualTeam
      }
    });
    return res as BusterPermissionTeam;
  });

  const usersListConfig = usePermissionUsers();
  const teamsListConfig = usePermissionsTeams();
  const permissionGroupsConfig = usePermissionsGroups();
  const datasetsConfig = usePermissionDatasets();

  return {
    ...usersListConfig,
    ...teamsListConfig,
    ...permissionGroupsConfig,
    ...datasetsConfig,
    users,
    teams,
    permissionGroups,
    createNewTeam,
    subscribeToPermissionGroup,
    updateTeam,
    createPermissionGroup,
    updatePermissionGroup,
    updateUser,
    unsubscribeFromPermissionGroup,
    unsubscribeFromUser,
    unsubscribeTeam,
    subscribeToUser,
    subscribeToTeam
  };
};

const BusterPermissions = createContext<ReturnType<typeof usePermissions>>(
  {} as ReturnType<typeof usePermissions>
);

export const BusterPermissionsProvider = React.memo<{
  children: React.ReactNode;
}>(({ children }) => {
  const value = usePermissions();
  return <BusterPermissions.Provider value={value}>{children}</BusterPermissions.Provider>;
});
BusterPermissionsProvider.displayName = 'BusterPermissionsProvider';

export const usePermissionsContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof usePermissions>, T>
) => useContextSelector(BusterPermissions, selector);

export const usePermissionsUserIndividual = ({ userId }: { userId: string }) => {
  const user = usePermissionsContextSelector((x) => x.users[userId]);
  const subscribeToUser = usePermissionsContextSelector((x) => x.subscribeToUser);
  const unsubscribeFromUser = usePermissionsContextSelector((x) => x.unsubscribeFromUser);

  useEffect(() => {
    if (userId) {
      subscribeToUser(userId);
    }

    return () => {
      unsubscribeFromUser(userId);
    };
  }, [subscribeToUser, userId]);

  return user;
};

export const usePermissionsTeamIndividual = ({ teamId }: { teamId: string }) => {
  const team = usePermissionsContextSelector((x) => x.teams[teamId]);
  const subscribeToTeam = usePermissionsContextSelector((x) => x.subscribeToTeam);
  const unsubscribeFromTeam = usePermissionsContextSelector((x) => x.unsubscribeTeam);

  useEffect(() => {
    if (teamId) {
      subscribeToTeam(teamId);
    }

    return () => {
      unsubscribeFromTeam(teamId);
    };
  }, [subscribeToTeam, teamId]);

  return team;
};

export const usePermissionsGroupIndividual = ({
  permissionGroupId
}: {
  permissionGroupId: string;
}) => {
  const permissionGroup = usePermissionsContextSelector(
    (x) => x.permissionGroups[permissionGroupId]
  );
  const subscribeToPermissionGroup = usePermissionsContextSelector(
    (x) => x.subscribeToPermissionGroup
  );
  const unsubscribeFromPermissionGroup = usePermissionsContextSelector(
    (x) => x.unsubscribeFromPermissionGroup
  );

  useEffect(() => {
    if (permissionGroupId) {
      subscribeToPermissionGroup(permissionGroupId);
    }

    return () => {
      unsubscribeFromPermissionGroup(permissionGroupId);
    };
  }, [subscribeToPermissionGroup, permissionGroupId]);

  return permissionGroup;
};
