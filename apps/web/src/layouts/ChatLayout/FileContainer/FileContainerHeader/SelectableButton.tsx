import React from 'react';

import { Button } from '@/components/ui/buttons';
import { AppTooltip } from '@/components/ui/tooltip';

export const SelectableButton = React.memo<{
  tooltipText: string;
  tooltipShortcuts?: string[];
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  selected?: boolean;
}>(({ tooltipText, tooltipShortcuts, icon, onClick, selected }) => {
  return (
    <AppTooltip title={tooltipText} shortcuts={tooltipShortcuts}>
      <Button
        color="default"
        selected={selected}
        variant={'ghost'}
        prefix={icon}
        onClick={onClick}
      />
    </AppTooltip>
  );
});

SelectableButton.displayName = 'SelectableButton';
