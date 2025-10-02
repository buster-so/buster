import { Link, useMatches, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Breadcrumb,
  type BreadcrumbItemType,
  createBreadcrumbItems,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { Xmark } from '@/components/ui/icons';
import { Route as ShortcutsRoute } from '@/routes/app/_app/home/shortcuts';

export const HomePageHeader = () => {
  const navigate = useNavigate();
  const isShortcutsPage = useMatches({
    select: (matches) => matches.some((match) => match.id === ShortcutsRoute.id),
  });

  const breadcrumbItems: BreadcrumbItemType[] = useMemo(() => {
    const items: BreadcrumbItemType[] = [{ label: 'Home', link: { to: '/app/home' } }];
    if (isShortcutsPage) {
      items.push({ label: 'Shortcuts', link: { to: '/app/home/shortcuts' } });
    }
    return createBreadcrumbItems(items);
  }, [isShortcutsPage]);

  useHotkeys(
    'esc',
    () => {
      if (isShortcutsPage) {
        navigate({ to: '/app/home' });
      }
    },
    {
      enabled: isShortcutsPage,
    }
  );

  return (
    <div className="flex items-center justify-between w-full">
      <Breadcrumb items={breadcrumbItems} />

      {isShortcutsPage && (
        <Link to="/app/home">
          <Button prefix={<Xmark />}>Close</Button>
        </Link>
      )}
    </div>
  );
};
