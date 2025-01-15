import { AppSegmented, AppSegmentedProps } from '@/components';
import React, { useMemo } from 'react';
import { CopyLinkButton } from './CopyLinkButton';
import { BusterShareAssetType } from '@/api/buster-rest';
import { ShareRole } from '@/api/buster-socket/threads';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/es/segmented';

export enum ShareMenuTopBarOptions {
  Share = 'Share',
  Publish = 'Publish',
  Embed = 'Embed',
  ShareWithGroupAndTeam = 'ShareWithGroupAndTeam'
}

export const ShareMenuTopBar: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  onChangeSelectedOption: (option: ShareMenuTopBarOptions) => void;
  onCopyLink: () => void;
  shareType: BusterShareAssetType;
  permission: ShareRole;
}> = React.memo(
  ({ shareType, onCopyLink, selectedOptions, onChangeSelectedOption, permission }) => {
    const isOwner = permission === ShareRole.OWNER;

    const options: AppSegmentedProps['options'] = useMemo(() => {
      return [
        {
          value: ShareMenuTopBarOptions.Share,
          label: 'Share',
          show: isOwner
        },
        {
          value: ShareMenuTopBarOptions.Publish,
          label: 'Publish',
          show: shareType !== BusterShareAssetType.COLLECTION && isOwner
        },
        {
          value: ShareMenuTopBarOptions.Embed,
          label: 'Embed',
          show: shareType !== BusterShareAssetType.COLLECTION
        }
      ].filter((o) => o.show);
    }, [shareType, isOwner]);

    const onChange = useMemoizedFn((v: SegmentedValue) => {
      onChangeSelectedOption(v as ShareMenuTopBarOptions);
    });

    return (
      <div className="flex h-[40px] items-center justify-between px-3">
        <AppSegmented options={options} value={selectedOptions} onChange={onChange} />

        <div className="flex items-center space-x-2">
          <CopyLinkButton onCopyLink={onCopyLink} />
        </div>
      </div>
    );
  }
);
ShareMenuTopBar.displayName = 'ShareMenuTopBar';
