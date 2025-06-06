import Link from 'next/link';
import React, { useMemo } from 'react';
import type { FileType } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { ArrowUpRight } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { assetParamsToRoute } from '@/lib/assets';

export const ReasoningFileButtons = React.memo(
  ({
    fileType,
    fileId,
    type,
    chatId,
    versionNumber
  }: {
    fileType: FileType;
    fileId: string;
    type: 'file' | 'status';
    chatId: string;
    versionNumber?: number;
  }) => {
    const href = useMemo(() => {
      return assetParamsToRoute({
        chatId,
        assetId: fileId,
        type: fileType,
        versionNumber
      });
    }, [chatId, fileId, fileType]);

    if (type === 'status') return null;

    return (
      <AppTooltip title="Open file" sideOffset={12}>
        <Link href={href || ''} prefetch>
          <Button variant="ghost" prefix={<ArrowUpRight />} />
        </Link>
      </AppTooltip>
    );
  }
);

ReasoningFileButtons.displayName = 'ReasoningFileButtons';
