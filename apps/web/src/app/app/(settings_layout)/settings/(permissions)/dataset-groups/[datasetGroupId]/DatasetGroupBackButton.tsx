import { BackButton } from '@/components/ui/buttons/BackButton';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const DatasetGroupBackButton = () => {
  const route = createBusterRoute({ route: BusterRoutes.SETTINGS_DATASET_GROUPS });
  const text = 'Dataset groups';

  return <BackButton text={text} linkUrl={route} />;
};
