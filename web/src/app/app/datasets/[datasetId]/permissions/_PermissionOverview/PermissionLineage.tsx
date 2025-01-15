import { DatasetPermissionOverviewUser } from '@/api/buster-rest/datasets';
import { AppMaterialIcons, AppPopover } from '@/components';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import { createStyles } from 'antd-style';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';

export const PermissionLineage: React.FC<{
  lineage: DatasetPermissionOverviewUser['lineage'];
  canQuery: DatasetPermissionOverviewUser['can_query'];
}> = ({ lineage, canQuery }) => {
  const { push } = useRouter();
  const hasMultipleLineage = lineage.length > 1;

  const items: React.ReactNode[] = useMemo(() => {
    if (!hasMultipleLineage) {
      return [<MultipleLineage key={'multiple-lineage'} lineage={lineage} />];
    }

    const firstItem = lineage[0];

    return firstItem.map((v, index) => {
      return (
        <React.Fragment key={index}>
          <SelectedComponent item={v} />
        </React.Fragment>
      );
    });
  }, [hasMultipleLineage, lineage, SelectedComponent]);

  return <LineageBreadcrumb items={items} canQuery={canQuery} />;
};

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
  }
};

const MultipleLineage: React.FC<{
  lineage: DatasetPermissionOverviewUser['lineage'];
}> = ({ lineage }) => {
  const { styles, cx } = useStyles();
  const Content = useMemo(() => {
    return (
      <div className="flex min-w-[200px] flex-col space-y-2 p-2">
        {lineage.map((item, lineageindex) => {
          const items = item.map((v, index) => {
            return <SelectedComponent key={index} item={v} />;
          });

          return <LineageBreadcrumb key={lineageindex} items={items} canQuery={true} />;
        })}
      </div>
    );
  }, [lineage]);

  return (
    <AppPopover placement="topRight" destroyTooltipOnHide trigger="click" content={Content}>
      <div className={cx(styles.linearItem, 'cursor-pointer')}>Multiple access sources</div>
    </AppPopover>
  );
};

interface LineageItemProps {
  id: string;
  name: string;
}

const UserLineageItem: React.FC<LineageItemProps> = ({ name, id }) => {
  const { styles, cx } = useStyles();
  return <div className={cx(styles.linearItem)}>{name}</div>;
};

const DatasetLineageItem: React.FC<LineageItemProps> = ({ name, id }) => {
  const { styles, cx } = useStyles();
  return (
    <Link href={createBusterRoute({ route: BusterRoutes.APP_DATASETS_ID, datasetId: id })}>
      <div className={cx(styles.linearItem)}>{name}</div>
    </Link>
  );
};

const PermissionGroupLineageItem: React.FC<LineageItemProps> = ({ name, id }) => {
  const { styles, cx } = useStyles();
  return <div className={cx(styles.linearItem)}>{name}</div>;
};

const CanQueryTag: React.FC<{
  canQuery: boolean;
}> = ({ canQuery }) => {
  const { styles, cx } = useStyles();
  return (
    <div
      className={cx(
        styles.canQueryTag,
        canQuery ? styles.canQueryTagSuccess : styles.canQueryTagError
      )}>
      {canQuery ? 'Can query' : 'Cannot query'}
    </div>
  );
};

const LineageBreadcrumb: React.FC<{
  items: React.ReactNode[];
  canQuery: boolean;
}> = ({ items, canQuery }) => {
  const { styles, cx } = useStyles();
  const BreadcrumbIcon = <AppMaterialIcons icon="chevron_right" />;

  const allItems = [...items, <CanQueryTag key="can-query" canQuery={canQuery} />];

  return (
    <div className={cx(styles.linearContainer, 'flex space-x-0')}>
      {allItems.map((item, index) => {
        return (
          <div key={index} className="flex items-center space-x-0">
            {item}
            {index < allItems.length - 1 && BreadcrumbIcon}
          </div>
        );
      })}
    </div>
  );
};

const useStyles = createStyles(({ token, css }) => ({
  linearContainer: css`
    color: ${token.colorTextSecondary};
  `,
  linearItem: css`
    color: ${token.colorTextSecondary};
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 4px;
    &:hover {
      color: ${token.colorText};
      background-color: ${token.colorFillSecondary};
    }
  `,
  canQueryTag: css`
    border-radius: 4px;
    padding: 4px 6px;
  `,
  canQueryTagSuccess: css`
    color: #34a32d;
    background-color: #edfff0;
  `,
  canQueryTagError: css`
    color: #ff9e00;
    background-color: #fff7ed;
  `
}));
