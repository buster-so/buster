import React from 'react';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';

export const DashboardEmptyState: React.FC<{
  onOpenAddContentModal: () => void;
}> = React.memo(({ onOpenAddContentModal }) => {
  return (
    <div className="-ml-1.5">
      <Button variant="ghost" prefix={<Plus />} onClick={onOpenAddContentModal}>
        Add content
      </Button>
    </div>
  );
});
DashboardEmptyState.displayName = 'DashboardEmptyState';

export const DashboardNoContentReadOnly: React.FC = React.memo(() => {
  return (
    <div className="border-border bg-background flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed shadow">
      <Text variant="secondary">No items added to dashboard</Text>
    </div>
  );
});
DashboardNoContentReadOnly.displayName = 'DashboardNoContentReadOnly';
