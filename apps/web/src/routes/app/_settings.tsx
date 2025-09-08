import { createFileRoute, getRouteApi, Outlet } from '@tanstack/react-router';
import { SettingsAppLayout } from '../../layouts/SettingsAppLayout';

const routeApi = getRouteApi('/app');

export const Route = createFileRoute('/app/_settings')({
  component: () => {
    const { initialLayout, layoutId, defaultLayout } = routeApi.useLoaderData();
    console.log('initialLayout', initialLayout);
    console.log('layoutId', layoutId);
    console.log('defaultLayout', defaultLayout);
    return (
      <SettingsAppLayout
        initialLayout={initialLayout}
        layoutId={layoutId}
        defaultLayout={defaultLayout}
      >
        <Outlet />
      </SettingsAppLayout>
    );
  },
});
