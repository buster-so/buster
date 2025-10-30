import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/_restricted_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto pt-16 pb-12 max-w-[630px] min-w-[500px]">
        <Outlet />
      </div>
    </div>
  );
}
