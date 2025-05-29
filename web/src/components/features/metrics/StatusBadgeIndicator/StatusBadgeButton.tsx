import { type BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';
import { StatusDropdownContent } from './StatusDropdownContent';

export const StatusBadgeButton: React.FC<{
  status: BusterMetricListItem['status'];
  id: string | string[];
  disabled?: boolean;
  isAdmin: boolean | undefined;
  variant?: 'default' | 'ghost';
  onVerify: (d: { id: string; status: VerificationStatus }[]) => Promise<void>;
}> = React.memo(
  ({
    isAdmin = false,
    variant = 'default',
    id,
    status = VerificationStatus.NOT_REQUESTED,
    onVerify,
    disabled
  }) => {
    const buttonText = Array.isArray(id) ? 'Status' : '';
    const disabledButton =
      disabled || ((!id || status === VerificationStatus.VERIFIED) && !isAdmin);

    const onChangeStatus = useMemoizedFn(async (newStatus: VerificationStatus) => {
      const ids = Array.isArray(id) ? id : [id];
      const params = ids.map((id) => ({ id, status: newStatus }));
      await onVerify(params);
    });

    return (
      <StatusDropdownContent isAdmin={isAdmin} status={status} onChangeStatus={onChangeStatus}>
        <Button
          disabled={disabledButton}
          prefix={<StatusBadgeIndicator showTooltip={false} status={status} size={16} />}
          variant={variant}>
          {buttonText}
        </Button>
      </StatusDropdownContent>
    );
  }
);
StatusBadgeButton.displayName = 'StatusBadgeButton';
