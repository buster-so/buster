'use client';

import { BackButton } from '@/components';
import { createBusterRoute, BusterRoutes } from '@/routes/busterRoutes';
import { useMemo } from 'react';

export const UsersBackButton = ({}: {}) => {
  //const previousRoute = useAppLayoutContextSelector((state) => state.previousRoute);

  const {
    route,
    text
  }: {
    route: string;
    text: string;
  } = useMemo(() => {
    return {
      route: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS }),
      text: 'Users'
    };
  }, []);

  return <BackButton text={text} linkUrl={route} />;
};
