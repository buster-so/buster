import React, { useMemo } from 'react';
import { ShareAssetType } from '@buster/server-shared/share';
import type { SegmentedItem } from '@/components/ui/segmented';
import { AppSegmented } from '@/components/ui/segmented';
import { useMemoizedFn } from '@/hooks';
import { CopyLinkButton } from './CopyLinkButton';

export enum ShareMenuTopBarOptions {
  Share = 'Share',
  Publish = 'Publish',
  Embed = 'Embed'
}

export const ShareMenuTopBar: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  onChangeSelectedOption: (option: ShareMenuTopBarOptions) => void;
  onCopyLink: () => void;
  assetType: ShareAssetType;
  canEditPermissions: boolean;
}> = React.memo(
  ({ assetType, onCopyLink, selectedOptions, onChangeSelectedOption, canEditPermissions }) => {
    const options: SegmentedItem<ShareMenuTopBarOptions>[] = useMemo(() => {
      return [
        {
          value: ShareMenuTopBarOptions.Share,
          label: 'Share',
          show: canEditPermissions
        },
        {
          value: ShareMenuTopBarOptions.Publish,
          label: 'Publish',
          show: assetType !== 'collection' && assetType !== 'report' && canEditPermissions
        },
        {
          value: ShareMenuTopBarOptions.Embed,
          label: 'Embed',
          show: assetType !== 'collection' && assetType !== 'report' && canEditPermissions
        }
      ]
        .filter((o) => o.show)
        .map((o) => ({ ...o, show: undefined }));
    }, [assetType, canEditPermissions]);

    const onChange = useMemoizedFn((v: SegmentedItem<ShareMenuTopBarOptions>) => {
      onChangeSelectedOption(v.value);
    });

    return (
      <div className="flex items-center justify-between">
        <AppSegmented type="button" options={options} value={selectedOptions} onChange={onChange} />

        <div className="flex items-center space-x-2">
          <CopyLinkButton onCopyLink={onCopyLink} />
        </div>
      </div>
    );
  }
);
ShareMenuTopBar.displayName = 'ShareMenuTopBar';
