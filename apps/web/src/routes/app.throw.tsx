import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useMount } from '../hooks/useMount';

export const Route = createFileRoute('/app/throw')({
  validateSearch: z.object({
    iterations: z.number().optional(),
  }),
  component: RouteComponent,
  beforeLoad: ({ search }) => {
    return {
      iterations: search.iterations,
    };
  },
  loader: async ({ context }) => {
    return {
      iterations: context.iterations,
    };
  },
  head: ({ loaderData }) => {
    return {
      meta: [
        {
          title: `Throw ${loaderData?.iterations}`,
        },
      ],
    };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const { iterations } = Route.useSearch();

  useMount(() => {
    setTimeout(() => {
      navigate({ to: '/app/throw2', replace: true, search: { iterations: (iterations ?? 0) + 1 } });
    }, 1000);
  });

  return <div className="bg-red-100">Hello "/app/throw"! </div>;
}
