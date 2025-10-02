import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import { ShortcutsController } from '@/controllers/ShortcutsController';

export const Route = createFileRoute('/app/_app/home/shortcuts')({
  component: RouteComponent,
  validateSearch: z.object({
    shortcut_id: z.string().optional(),
  }),
});

function RouteComponent() {
  return (
    <div className="mt-12 mx-auto w-full min-w-0 px-8 mb-6">
      <div className="min-w-[500px] max-w-[730px] mx-auto">
        <ShortcutsController />
        <Outlet />
      </div>
    </div>
  );
}
