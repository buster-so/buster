import { BusterDashboardMetric } from '@/api/buster_rest';
import { useStyles } from '@/app/app/_components/ShareMenu/useStyles';
import { AppMaterialIcons, Title, Text } from '@/components';
import { SortableItemContext } from '@/components/grid/_BusterSortableItemDragContainer';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { useMemoizedFn } from 'ahooks';
import { MenuProps, Dropdown, Button } from 'antd';
import Link from 'next/link';
import React, { useContext, useMemo } from 'react';

export const MetricTitle: React.FC<{
  title: BusterDashboardMetric['name'];
  timeFrame?: BusterDashboardMetric['time_frame'];
  description?: BusterDashboardMetric['description'];
  metricLink: string;
  isDragOverlay: boolean;
  threadId: string;
  dashboardId: string;
  allowEdit?: boolean;
}> = React.memo(
  ({
    threadId,
    allowEdit = true,
    dashboardId,
    title,
    description,
    isDragOverlay,
    metricLink,
    timeFrame
  }) => {
    const { attributes, listeners, isDragging } = useContext(SortableItemContext);
    const { cx } = useStyles();

    const useEllipsis = !isDragOverlay && !isDragging;

    const titleConfig = useMemo(() => {
      return {
        ellipsis: {
          tooltip: {
            title: useEllipsis ? title : ''
          }
        }
      };
    }, [title, useEllipsis]);

    return (
      <Link href={metricLink}>
        <div
          {...attributes}
          {...listeners}
          className={cx('group flex h-full cursor-pointer flex-col space-y-0.5 px-4 py-2')}>
          <div className="flex w-full justify-between space-x-0.5">
            <Title {...titleConfig} level={4}>
              {`${title}`}
            </Title>

            {isDragOverlay || !allowEdit ? (
              <ThreeDotPlaceholder />
            ) : (
              <ThreeDotMenu
                className="opacity-0 transition group-hover:opacity-100"
                dashboardId={dashboardId}
                threadId={threadId}
              />
            )}
          </div>

          <div className="flex w-full items-center overflow-hidden">
            <Text
              className={`flex w-full text-nowrap pr-2 ${
                timeFrame || description ? 'visible' : 'hidden'
              }`}
              size="sm"
              type="secondary"
              ellipsis={true}>
              {timeFrame || '_'}

              {description && timeFrame && ' • '}

              {description}
            </Text>
          </div>
        </div>
      </Link>
    );
  }
);
MetricTitle.displayName = 'MetricTitle';

const ThreeDotPlaceholder: React.FC<{
  className?: string;
}> = React.memo(({ className }) => {
  return (
    <div className={`relative h-[24px] w-[24px] ${className}`}>
      {/* <Button
        className="absolute top-[-2px] hidden"
        type="text"
        icon={<AppMaterialIcons icon="more_vert" />}
      /> */}
    </div>
  );
});
ThreeDotPlaceholder.displayName = 'ThreeDotPlaceholder';

const ThreeDotMenu: React.FC<{
  className?: string;
  dashboardId: string;
  threadId: string;
}> = React.memo(({ dashboardId, threadId, className }) => {
  const removeThreadFromDashboard = useBusterThreadsContextSelector(
    (x) => x.removeThreadFromDashboard
  );

  const dropdownItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'delete',
        label: 'Delete',
        icon: <AppMaterialIcons icon="delete" />,
        onClick: async () => {
          try {
            await removeThreadFromDashboard({
              dashboardId,
              threadId
            });
          } catch (error) {
            //
          }
        }
      }
    ],
    [dashboardId, threadId]
  );

  const dropdownMenu = useMemo(() => {
    return {
      items: dropdownItems
    };
  }, [dropdownItems]);

  const onClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return (
    <div onClick={onClick} className={`relative w-[24px] ${className}`}>
      <Dropdown trigger={['click']} menu={dropdownMenu}>
        <Button
          className="absolute top-[-2px]"
          type="text"
          icon={<AppMaterialIcons icon="more_vert" />}
        />
      </Dropdown>
    </div>
  );
});
ThreeDotMenu.displayName = 'ThreeDotMenu';
