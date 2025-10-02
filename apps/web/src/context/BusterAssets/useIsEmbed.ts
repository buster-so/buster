import { useMatchRoute } from '@tanstack/react-router';
import { Route as EmbedRoute } from '@/routes/embed';

export const useIsEmbed = () => {
  const matchRoute = useMatchRoute();
  const matches = matchRoute({
    to: EmbedRoute.id,
    fuzzy: true,
  });
  return !!matches;
};
