import React from 'react';
import { type BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import { StatusNotRequestedIcon } from '@/components/ui/icons/customIcons/Status_NotRequested';
import { CircleCheck, CircleXmark } from '@/components/ui/icons/NucleoIconFilled';
import { AppTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/classMerge';
import { HalfIcon } from './HalfIcon';
import { getTooltipText } from './helpers';
import { ThreeFourthIcon } from './ThreeFourthIcon';

export const StatusBadgeIndicator: React.FC<{
  status: BusterMetricListItem['status'];
  size?: number;
  className?: string;
  showTooltip?: boolean;
}> = React.memo(
  ({
    showTooltip = true,
    status = VerificationStatus.NOT_REQUESTED,
    size = 16,
    className = ''
  }) => {
    const Icon = getIcon(status);
    const colorClasses = getColorClasses(status);
    const tooltipText = getTooltipText(status);
    const isNotVerified =
      status === VerificationStatus.NOT_VERIFIED || VerificationStatus.NOT_REQUESTED;
    const sharedClass = cn('flex items-center justify-center rounded-full', colorClasses);
    return (
      <AppTooltip title={showTooltip ? tooltipText : ''}>
        <div
          className={`rounded-full ${className} ${sharedClass} ${isNotVerified ? '' : ''}`}
          style={{
            width: size,
            height: size
          }}>
          <Icon size={size} />
        </div>
      </AppTooltip>
    );
  }
);
StatusBadgeIndicator.displayName = 'StatusBadgeIndicator';

const statusRecordIcon: Record<VerificationStatus, React.FC<{ size?: number }>> = {
  [VerificationStatus.VERIFIED]: () => <CircleCheck />,
  [VerificationStatus.REQUESTED]: () => <HalfIcon />,
  [VerificationStatus.IN_REVIEW]: () => <ThreeFourthIcon />,
  [VerificationStatus.BACKLOGGED]: () => <CircleXmark />,
  [VerificationStatus.NOT_VERIFIED]: () => <StatusNotRequestedIcon />,
  [VerificationStatus.NOT_REQUESTED]: () => <StatusNotRequestedIcon />
};

const getIcon = (status: BusterMetricListItem['status']) => {
  return statusRecordIcon[status] || (() => <React.Fragment />);
};

const statusRecordColors: Record<VerificationStatus, string> = {
  [VerificationStatus.VERIFIED]: 'text-[#34A32D]!',
  [VerificationStatus.REQUESTED]: 'text-[#F2BE01]!',
  [VerificationStatus.IN_REVIEW]: 'text-[#7C3AED]!',
  [VerificationStatus.BACKLOGGED]: 'text-icon-color',
  [VerificationStatus.NOT_VERIFIED]: 'text-icon-color',
  [VerificationStatus.NOT_REQUESTED]: 'text-icon-color'
};

const getColorClasses = (status: BusterMetricListItem['status']) => {
  return statusRecordColors[status] || statusRecordColors[VerificationStatus.NOT_REQUESTED];
};
