import { cva } from 'class-variance-authority';
import Link from 'next/link';
import React, { useMemo } from 'react';
import type { DatasetPermissionOverviewUser } from '@/api/asset_interfaces';
import { ChevronRight } from '@/components/ui/icons';
import { Popover } from '@/components/ui/popover/Popover';
import { cn } from '@/lib/utils';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const PermissionLineageBreadcrumb: React.FC<{
  lineage: DatasetPermissionOverviewUser['lineage'];
  canQuery: DatasetPermissionOverviewUser['can_query'];
}> = React.memo(({ lineage, canQuery }) => {
  const hasMultipleLineage = lineage.length > 1;
  const hasNoLineage = lineage.length === 0;

  const items: React.ReactNode[] = useMemo(() => {
    if (hasNoLineage) {
      return [<UserLineageItem key="default-access" name="Default access" id="default-access" />];
    }

    if (hasMultipleLineage) {
      return [<MultipleLineage key={'multiple-lineage'} lineage={lineage} canQuery={canQuery} />];
    }

    const firstItem = lineage[0];

    return firstItem.map((v) => {
      return (
        <React.Fragment key={v.id}>
          <SelectedComponent item={v} />
        </React.Fragment>
      );
    });
  }, [hasMultipleLineage, hasNoLineage, lineage, SelectedComponent]);

  return <LineageBreadcrumb items={items} canQuery={canQuery} />;
});
PermissionLineageBreadcrumb.displayName = 'PermissionLineageBreadcrumb';

const SelectedComponent: React.FC<{
  item: DatasetPermissionOverviewUser['lineage'][number][number];
}> = ({ item }) => {
  switch (item.type) {
    case 'user':
      return <UserLineageItem name={item.name} id={item.id} />;
    case 'datasets':
      return <DatasetLineageItem name={item.name} id={item.id} />;
    case 'permissionGroups':
      return <PermissionGroupLineageItem name={item.name} id={item.id} />;
    case 'datasetGroups':
      return <DatasetGroupLineageItem name={item.name} id={item.id} />;
  }
};

const MultipleLineage: React.FC<{
  lineage: DatasetPermissionOverviewUser['lineage'];
  canQuery: DatasetPermissionOverviewUser['can_query'];
}> = ({ lineage, canQuery }) => {
  // const { styles, cx } = useStyles();
  const Content = useMemo(() => {
    return (
      <div className="flex min-w-[200px] flex-col space-y-2">
        {lineage.map((item, lineageIndex) => {
          const items = item.map((v) => {
            return <SelectedComponent key={v.id} item={v} />;
          });

          return (
            <LineageBreadcrumb
              key={item[0]?.id || lineageIndex}
              items={items}
              canQuery={canQuery}
            />
          );
        })}
      </div>
    );
  }, [lineage]);

  return (
    <Popover side="top" align="start" trigger="click" content={Content} size="sm">
      <div className={linearItem({ clickable: true })}>Multiple access sources</div>
    </Popover>
  );
};

interface LineageItemProps {
  id: string;
  name: string;
}

const UserLineageItem: React.FC<LineageItemProps> = ({ name, id }) => {
  return <div className={linearItem({ clickable: false })}>{name}</div>;
};

const DatasetLineageItem: React.FC<LineageItemProps> = ({ name, id }) => {
  return (
    <Link href={createBusterRoute({ route: BusterRoutes.APP_DATASETS_ID, datasetId: id })}>
      <div className={linearItem({ clickable: true })}>{name}</div>
    </Link>
  );
};

const PermissionGroupLineageItem: React.FC<LineageItemProps> = ({ name, id }) => {
  return <div className={linearItem({ clickable: false })}>{name}</div>;
};

const DatasetGroupLineageItem: React.FC<LineageItemProps> = ({ name, id }) => {
  return <div className={linearItem({ clickable: false })}>{name}</div>;
};

const CanQueryTag: React.FC<{
  canQuery: boolean;
}> = ({ canQuery }) => {
  return (
    <div className={canQueryTag({ status: canQuery ? 'success' : 'error' })}>
      {canQuery ? 'Can query' : 'Cannot query'}
    </div>
  );
};

const LineageBreadcrumb: React.FC<{
  items: React.ReactNode[];
  canQuery: boolean;
}> = ({ items, canQuery }) => {
  const allItems = [...items, <CanQueryTag key="can-query" canQuery={canQuery} />];

  return (
    <div className={cn('text-text-secondary', 'flex justify-end space-x-0.5')}>
      {allItems.map((item: React.ReactNode | { id: string }, index) => {
        const key = typeof item === 'object' && item !== null && 'id' in item ? item.id : index;
        return (
          <div key={key} className="flex items-center space-x-0">
            {typeof item === 'object' && item !== null && 'id' in item ? item.id : item}
            {index < allItems.length - 1 && (
              <div className="flex items-center justify-center">
                <ChevronRight />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const linearItem = cva('text-text-secondary text-base px-1 py-1.5 rounded-sm', {
  variants: {
    clickable: {
      true: 'cursor-pointer hover:text-text hover:bg-item-hover-active',
      false: ''
    }
  }
});

const canQueryTag = cva('rounded-sm px-1 py-1.5 text-base', {
  variants: {
    status: {
      success: 'bg-success-background text-success-foreground',
      error: 'bg-danger-background text-danger-foreground'
    }
  }
});
