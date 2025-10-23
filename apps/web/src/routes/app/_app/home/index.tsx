import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { HomePageController } from '@/controllers/HomePage';

const searchParamsSchema = z.object({
  q: z.string().optional(),
  submit: z
    .preprocess((val) => {
      if (typeof val === 'string') val.toLowerCase() === 'true';
      return val;
    }, z.boolean())
    .optional(),
});

export const Route = createFileRoute('/app/_app/home/')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
});

function RouteComponent() {
  const { q, submit } = Route.useSearch();
  return <HomePageController initialValue={q} autoSubmit={submit} />;
}
