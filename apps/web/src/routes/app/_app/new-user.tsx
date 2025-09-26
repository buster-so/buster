import { createFileRoute, Outlet } from '@tanstack/react-router';
import NewUserWelcome from '@/assets/png/new-user-welcome.png';

export const Route = createFileRoute('/app/_app/new-user')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="h-[100vh]">
      <div className="flex h-[100vh] items-center">
        <div className="mx-auto flex min-h-full w-full">
          <div className="hidden w-1/2 min-w-[400px] max-w-[650px] md:flex">
            <Outlet />
          </div>
          <div className="relative flex w-full flex-col items-center justify-center">
            <div
              className="w-full bg-backgroud"
              style={{
                height: '85vh',
                background: `url(${NewUserWelcome}) no-repeat left center`,
                backgroundSize: 'cover',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
