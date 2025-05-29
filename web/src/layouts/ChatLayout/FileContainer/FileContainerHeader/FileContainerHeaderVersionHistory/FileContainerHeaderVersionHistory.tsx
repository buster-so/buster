'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/buttons';
import { ArrowLeft } from '@/components/ui/icons';
import { useCloseVersionHistory } from './useCloseVersionHistory';
import { VersionHistoryHeaderButtons } from './VersionHistoryHeaderButtons';

export const FileContainerHeaderVersionHistory = React.memo(() => {
  return (
    <div className="flex w-full items-center justify-between gap-x-1.5">
      <ExitVersionHistoryButton />
      <VersionHistoryHeaderButtons />
    </div>
  );
});

FileContainerHeaderVersionHistory.displayName = 'FileContainerHeaderVersionHistory';

const ExitVersionHistoryButton = React.memo(() => {
  const { href } = useCloseVersionHistory();

  return (
    <Link href={href} prefetch>
      <Button variant="link" prefix={<ArrowLeft />}>
        Exit version history
      </Button>
    </Link>
  );
});

ExitVersionHistoryButton.displayName = 'ExitVersionHistoryButton';
