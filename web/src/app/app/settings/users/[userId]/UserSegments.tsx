import React from 'react';
import { AppSegmented } from '@/components/segmented';
import { OrganizationUser } from '@/api/buster-rest';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/es/segmented';
import { Divider } from 'antd';

export enum UserSegmentsApps {
  OVERVIEW = 'Overview',
  DATASET_GROUPS = 'Dataset Groups',
  DATASETS = 'Datasets',
  ATTRIBUTES = 'Attributes',
  TEAMS = 'Teams'
}

const options: { label: string; value: UserSegmentsApps }[] = [
  { label: 'Overview', value: UserSegmentsApps.OVERVIEW },
  { label: 'Dataset Groups', value: UserSegmentsApps.DATASET_GROUPS, hidden: true },
  { label: 'Datasets', value: UserSegmentsApps.DATASETS, hidden: true },
  { label: 'Attributes', value: UserSegmentsApps.ATTRIBUTES, hidden: true },
  { label: 'Teams', value: UserSegmentsApps.TEAMS, hidden: true }
].filter((option) => !option.hidden);

export const UserSegments: React.FC<{
  selectedApp: UserSegmentsApps;
  onSelectApp: (app: UserSegmentsApps) => void;
  user: OrganizationUser;
}> = ({ selectedApp, onSelectApp, user }) => {
  const onChange = useMemoizedFn((value: SegmentedValue) => {
    onSelectApp(value as UserSegmentsApps);
  });

  return (
    <div className="flex flex-col space-y-2">
      <AppSegmented options={options} value={selectedApp} onChange={onChange} />
      <Divider />
    </div>
  );
};
