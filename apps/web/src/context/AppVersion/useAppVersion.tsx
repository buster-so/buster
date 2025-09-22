import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getAppBuildId } from '@/api/server-functions/getAppVersion';
import { Text } from '@/components/ui/typography';
import { useWindowFocus } from '@/hooks/useWindowFocus';
import { useBusterNotifications } from '../BusterNotifications';

const browserBuild = import.meta.env.VITE_BUILD_ID;

export const useAppVersion = () => {
  const { openInfoNotification } = useBusterNotifications();
  const { data, refetch, isFetched } = useQuery({
    queryKey: ['app-version'] as const,
    queryFn: getAppBuildId,
    refetchInterval: 20000, // 20 seconds
  });
  const isChanged = data?.buildId !== browserBuild && isFetched && browserBuild;

  const reloadWindow = () => {
    window.location.reload();
  };

  useWindowFocus(() => {
    refetch().then(() => {
      if (isChanged) {
        //  reloadWindow();
      }
    });
  });

  useEffect(() => {
    console.log('isChanged', data?.buildId, browserBuild);
    if (isChanged) {
      openInfoNotification({
        duration: Infinity,
        title: 'New Version Available',
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
  //  const [countdown, setCountdown] = useState(30);
  //   useEffect(() => {
  //     const interval = setInterval(() => {
  //       setCountdown((prev) => Math.max(prev - 1, 0));
  //       if (countdown === 0) {
  //         //  window.location.reload();
  //       }
  //     }, 1000);
  //     return () => clearInterval(interval);
  //   }, []);

  return (
    <Text>
      A new version of the app is available. Please refresh the page to get the latest features.
    </Text>
  );
};
