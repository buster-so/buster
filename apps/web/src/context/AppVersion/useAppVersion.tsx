import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { versionGetAppVersion } from '@/api/query_keys/version';
import { Text } from '@/components/ui/typography';
import { useWindowFocus } from '@/hooks/useWindowFocus';
import { useBusterNotifications } from '../BusterNotifications';

const browserBuild = import.meta.env.VITE_BUILD_ID as string;

const checkNewVersion = (buildId: string | undefined): boolean => {
  if (!buildId || !browserBuild) return false;
  return buildId !== browserBuild;
};

export const useAppVersion = () => {
  const { openInfoNotification } = useBusterNotifications();
  const { data, refetch } = useQuery({
    ...versionGetAppVersion,
    refetchOnReconnect: true,
    refetchOnMount: true,
    notifyOnChangeProps: ['data'],
  });
  const isChanged = checkNewVersion(data?.buildId);

  const reloadWindow = () => {
    window.location.reload();
  };

  useWindowFocus(() => {
    refetch().then(() => {
      if (isChanged) {
        reloadWindow();
      }
    });
  });

  useEffect(() => {
    if (isChanged) {
      openInfoNotification({
        duration: Infinity,
        title: 'New version available',
        message: <AppVersionMessage />,
        dismissible: false,
        className: 'min-w-[450px]',
        action: {
          label: 'Refresh',
          onClick: () => {
            reloadWindow();
          },
        },
      });
    }
  }, [isChanged]);
};

const AppVersionMessage = () => {
  return (
    <Text>
      A new version of the app is available. Please refresh the page to get the latest features.
    </Text>
  );
};

export const useIsVersionChanged = () => {
  const { data = false } = useQuery({
    ...versionGetAppVersion,
    select: useCallback((data: { buildId: string }) => checkNewVersion(data.buildId), []),
    notifyOnChangeProps: ['data'],
  });
  return data;
};

export const useAppVersionMeta = () => {
  const { data } = useQuery({
    ...versionGetAppVersion,
    notifyOnChangeProps: ['data'],
  });
  return useMemo(() => ({ ...data, browserBuild }), [data]);
};
