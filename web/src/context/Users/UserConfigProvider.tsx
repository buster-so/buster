import { BusterOrganizationRole, BusterUserPalette, BusterUserResponse } from '@/api/busterv2';
import React, { PropsWithChildren, useRef, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { useFavoriteProvider } from './useFavoriteProvider';
import { getUserInfo } from '@/api/busterv2/users/requests';
import { useSupabaseContext } from '../Supabase';
import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useBusterNotifications } from '../BusterNotifications';
import { timeout } from '@/utils';

export const useUserConfigProvider = ({ userInfo }: { userInfo: BusterUserResponse | null }) => {
  const busterSocket = useBusterWebSocket();
  const { openSuccessMessage } = useBusterNotifications();
  const isAnonymousUser = useSupabaseContext((state) => state.isAnonymousUser);
  const accessToken = useSupabaseContext((state) => state.accessToken);

  const [userResponse, setUserResponse] = useState<BusterUserResponse | null>(userInfo);

  const user = userResponse?.user;
  const userTeams = userResponse?.teams || [];
  const userOrganizations = userResponse?.organizations[0];
  const userRole = userOrganizations?.role;
  const isUserRegistered =
    !!userResponse && !!userResponse?.organizations?.[0]?.id && !!userResponse?.user?.name;
  const isAdmin =
    userRole === BusterOrganizationRole.DATA_ADMIN ||
    userRole === BusterOrganizationRole.WORKSPACE_ADMIN;

  const inviteUsers = useMemoizedFn(async (emails: string[], team_ids?: string[]) => {
    busterSocket.emit({
      route: '/users/invite',
      payload: { emails, team_ids }
    });
    await timeout(350);
    openSuccessMessage('Invites sent');
  });

  const onCreateUserOrganization = useMemoizedFn(
    async ({
      name,
      company,
      alreadyHasCompany
    }: {
      name: string;
      company: string;
      alreadyHasCompany?: boolean;
    }) => {
      if (!alreadyHasCompany) {
        const orgRes = await busterSocket.emitAndOnce({
          emitEvent: {
            route: '/organizations/post',
            payload: { name: company }
          },
          responseEvent: {
            route: '/organizations/post:post',
            callback: (v) => v
          }
        });
      }
      const userRes = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/permissions/users/update',
          payload: { name, id: user?.id! }
        },
        responseEvent: {
          route: '/permissions/users/update:updateUserPermission',
          callback: (v) => v
        }
      });
      await updateUserInfo();

      return;
    }
  );

  const updateUserInfo = useMemoizedFn(async () => {
    const res = await getUserInfo({ jwtToken: accessToken });
    if (res) {
      setUserResponse(res);
    }
  });

  const favoriteConfig = useFavoriteProvider();

  return {
    onCreateUserOrganization,
    inviteUsers,
    userTeams,
    loadedUserTeams: !!userResponse,
    user,
    userRole,
    isAdmin,
    userOrganizations,
    isUserRegistered,
    isAnonymousUser,
    ...favoriteConfig
  };
};

const BusterUserConfig = createContext<ReturnType<typeof useUserConfigProvider>>(
  {} as ReturnType<typeof useUserConfigProvider>
);

export const BusterUserConfigProvider = React.memo<
  PropsWithChildren<{ userInfo: BusterUserResponse | undefined }>
>(({ children, userInfo }) => {
  const userConfig = useUserConfigProvider({
    userInfo: userInfo || null
  });

  return <BusterUserConfig.Provider value={userConfig}>{children}</BusterUserConfig.Provider>;
});
BusterUserConfigProvider.displayName = 'BusterUserConfigProvider';

export const useUserConfigContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useUserConfigProvider>, T>
) => useContextSelector(BusterUserConfig, selector);
