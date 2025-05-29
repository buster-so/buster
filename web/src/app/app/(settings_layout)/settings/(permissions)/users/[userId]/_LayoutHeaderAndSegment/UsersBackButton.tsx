'use client';

import { BackButton } from '@/components/ui/buttons';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useMemo } from 'react';

export const UsersBackButton = () => {
  const {
    route,
    text
  }: {
    route: string;
    text: string;
  } = useMemo(() => {
    return {
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_USERS }),
      text: 'Users'
    };
  }, []);

  return <BackButton text={text} linkUrl={route} />;
};
