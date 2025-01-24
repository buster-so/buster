import { BackButton } from '@/components/buttons/BackButton';
import { createBusterRoute, BusterRoutes } from '@/routes/busterRoutes';

export const DatasetGroupBackButton = ({}: {}) => {
  const route = createBusterRoute({ route: BusterRoutes.APP_SETTINGS_DATASET_GROUPS });
  const text = 'Dataset groups';

  return <BackButton text={text} linkUrl={route} />;
};
