import React, { useMemo } from 'react';
import { AppSegmented } from '@/components/segmented';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/es/segmented';
import { Divider } from 'antd';
import { createBusterRoute, BusterRoutes } from '@/routes';

export enum UserSegmentsApps {
  OVERVIEW = 'Overview',
  PERMISSION_GROUPS = 'Permission Groups',
  DATASET_GROUPS = 'Dataset Groups',
  DATASETS = 'Datasets',
  ATTRIBUTES = 'Attributes',
  TEAMS = 'Teams'
}

export const SegmentToApp = {
  [BusterRoutes.APP_SETTINGS_USERS]: UserSegmentsApps.OVERVIEW,
  [BusterRoutes.APP_SETTINGS_USERS_ID]: UserSegmentsApps.OVERVIEW,
  [BusterRoutes.APP_SETTINGS_USERS_ID_PERMISSION_GROUPS]: UserSegmentsApps.PERMISSION_GROUPS,
  [BusterRoutes.APP_SETTINGS_USERS_ID_DATASET_GROUPS]: UserSegmentsApps.DATASET_GROUPS,
  [BusterRoutes.APP_SETTINGS_USERS_ID_DATASETS]: UserSegmentsApps.DATASETS,
  [BusterRoutes.APP_SETTINGS_USERS_ID_ATTRIBUTES]: UserSegmentsApps.ATTRIBUTES,
  [BusterRoutes.APP_SETTINGS_USERS_ID_TEAMS]: UserSegmentsApps.TEAMS
};

export const UserSegments: React.FC<{
  isAdmin: boolean;
  selectedApp: UserSegmentsApps;
  onSelectApp: (app: UserSegmentsApps) => void;
  userId: string;
}> = React.memo(({ isAdmin, selectedApp, onSelectApp, userId }) => {
  const onChange = useMemoizedFn((value: SegmentedValue) => {
    onSelectApp(value as UserSegmentsApps);
  });
  const options = useMemo(
    () =>
      [
        {
          label: 'Overview',
          value: UserSegmentsApps.OVERVIEW,
          link: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS_ID, userId })
        },
        {
          label: 'Permissions groups',
          value: UserSegmentsApps.PERMISSION_GROUPS,
          link: createBusterRoute({
            route: BusterRoutes.APP_SETTINGS_USERS_ID_PERMISSION_GROUPS,
            userId
          }),
          hide: !isAdmin
        },
        {
          label: 'Dataset groups',
          value: UserSegmentsApps.DATASET_GROUPS,
          link: createBusterRoute({
            route: BusterRoutes.APP_SETTINGS_USERS_ID_DATASET_GROUPS,
            userId
          })
        },
        {
          label: 'Datasets',
          value: UserSegmentsApps.DATASETS,
          link: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS_ID_DATASETS, userId })
        },
        {
          label: 'Attributes',
          value: UserSegmentsApps.ATTRIBUTES,
          link: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS_ID_ATTRIBUTES, userId }),
          hide: true
        },
        {
          label: 'Teams',
          value: UserSegmentsApps.TEAMS,
          link: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS_ID_TEAMS, userId })
        }
      ]
        .filter((x) => !x.hide)
        .map((x) => ({ ...x, hide: undefined })),
    [userId]
  );

  return (
    <div className="flex flex-col space-y-2">
      <AppSegmented options={options} value={selectedApp} onChange={onChange} />
      <Divider />
    </div>
  );
});

UserSegments.displayName = 'UserSegments';
