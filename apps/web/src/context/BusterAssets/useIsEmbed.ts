import { useMatchRoute } from '@tanstack/react-router';
import { Route as EmbedRoute } from '@/routes/embed';

export const useIsEmbed = () => {
  const matchRoute = useMatchRoute();
  const embedMatch = matchRoute({
    to: EmbedRoute.id,
    fuzzy: true,
  });
  const screenshotMatch = matchRoute({
    to: '/screenshots',
    fuzzy: true,
  });

  return !!embedMatch || !!screenshotMatch;
};

export const useIsScreenshotMode = () => {
  const matchRoute = useMatchRoute();
  const screenshotMatch = matchRoute({
    to: '/screenshots',
    fuzzy: true,
  });
  return !!screenshotMatch;
};
