import { BusterRoutes, createBusterRoute } from '@/routes';
import { HeaderContainer } from '../../_HeaderContainer';
import { DatasourceForm } from './_forms';

export default async function Page(props: {
  params: Promise<{
    datasourceId: string;
  }>;
}) {
  const params = await props.params;

  const { datasourceId } = params;

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
