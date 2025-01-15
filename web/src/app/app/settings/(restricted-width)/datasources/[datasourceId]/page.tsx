import { BusterRoutes, createBusterRoute } from '@/routes';
import { HeaderContainer } from '../_HeaderContainer';
import { DatasourceForm } from './_DatasourceForm';

export default function Page({
  params: { datasourceId }
}: {
  params: {
    datasourceId: string;
  };
}) {
  return (
    <div className="flex flex-col space-y-5">
      <HeaderContainer
        buttonText="Datasources"
        linkUrl={createBusterRoute({
          route: BusterRoutes.SETTINGS_DATASOURCES
        })}
      />
      <DatasourceForm datasourceId={datasourceId} />
    </div>
  );
}
