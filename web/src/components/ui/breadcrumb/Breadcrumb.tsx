import React, { useMemo } from 'react';

import {
  Breadcrumb as BreadcrumbBase,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
} from './BreadcrumbBase';
import { createBusterRoute } from '@/routes/busterRoutes';
import { Dropdown, type DropdownItem } from '../dropdown/Dropdown';
import Link from 'next/link';

type CreateBusterRouteParams = Parameters<typeof createBusterRoute>[0];

export interface BreadcrumbItem {
  label: string | null; //if null, it will be an ellipsis
  route?: CreateBusterRouteParams;
  dropdown?: { label: string; route: CreateBusterRouteParams }[];
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  activeIndex?: number; //default will be the last item
}

export const Breadcrumb = React.memo(
  React.forwardRef<HTMLElement, BreadcrumbProps>(({ items, activeIndex, className }, ref) => {
    const chosenIndex = activeIndex ?? items.length - 1;
    const lastItemIndex = items.length - 1;

    return (
      <BreadcrumbBase className={className}>
        <BreadcrumbList>
          {items.map((item, index) => (
            <BreadcrumbItemSelector
              key={index}
              item={item}
              isActive={chosenIndex === index}
              isLast={index === lastItemIndex}
            />
          ))}
        </BreadcrumbList>
      </BreadcrumbBase>
    );
  })
);

const BreadcrumbItemSelector: React.FC<{
  item: BreadcrumbItem;
  isActive: boolean;
  isLast: boolean;
}> = ({ item, isActive, isLast }) => {
  const ChosenComponent = useMemo(() => {
    if (item.dropdown) {
      return <BreadcrumbDropdown items={item.dropdown} />;
    }
    if (isActive) {
      return <BreadcrumbPage>{item.label}</BreadcrumbPage>;
    }

    return (
      <BreadcrumbLink asChild>
        {item.route ? (
          <Link href={createBusterRoute(item.route)} className="truncate">
            {item.label}
          </Link>
        ) : (
          <span className="truncate">{item.label}</span>
        )}
      </BreadcrumbLink>
    );
  }, [isActive, item.label, item.route, item.dropdown]);

  return (
    <>
      <BreadcrumbItem className={isLast ? 'truncate' : ''}>{ChosenComponent}</BreadcrumbItem>
      {!isLast && <BreadcrumbSeparator />}
    </>
  );
};

const BreadcrumbDropdown: React.FC<{
  items: { label: string; route: CreateBusterRouteParams }[];
}> = ({ items }) => {
  const dropdownItems: DropdownItem[] = useMemo(() => {
    return items.map((item) => {
      const route = createBusterRoute(item.route);
      return {
        label: (
          <Link href={route} className="truncate">
            {item.label}
          </Link>
        ),
        value: route
      };
    });
  }, [items]);

  return (
    <Dropdown items={dropdownItems}>
      <div className="flex cursor-pointer items-center">
        <BreadcrumbEllipsis className="h-4 w-4" />
        <span className="sr-only">Toggle menu</span>
      </div>
    </Dropdown>
  );
};

Breadcrumb.displayName = 'Breadcrumb';
