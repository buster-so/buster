import { BackButton } from '@/components/buttons/BackButton';
import { createBusterRoute, BusterRoutes } from '@/routes/busterRoutes';

export const UsersBackButton = ({}: {}) => {
  const route = createBusterRoute({ route: BusterRoutes.SETTINGS_PERMISSION_GROUPS });
  const text = 'Permission groups';

  return <BackButton text={text} linkUrl={route} />;
};
