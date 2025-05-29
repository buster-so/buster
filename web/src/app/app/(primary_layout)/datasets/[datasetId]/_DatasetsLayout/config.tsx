import type React from 'react';
import { CircleInfo, Code3, SquareMenu } from '@/components/ui/icons';

export enum DatasetApps {
  OVERVIEW = 'overview',
  PERMISSIONS = 'permissions',
  EDITOR = 'editor'
}

export const DataSetAppText: Record<DatasetApps, string> = {
  [DatasetApps.OVERVIEW]: 'Overview',
  [DatasetApps.PERMISSIONS]: 'Permissions',
  [DatasetApps.EDITOR]: 'Editor'
};

export const DataSetAppIcons: Record<DatasetApps, React.ReactNode> = {
  [DatasetApps.OVERVIEW]: <CircleInfo />,
  [DatasetApps.PERMISSIONS]: <SquareMenu />,
  [DatasetApps.EDITOR]: <Code3 />
};
