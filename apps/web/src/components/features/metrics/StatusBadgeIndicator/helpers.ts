import { type BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';

const statusRecordText: Record<VerificationStatus, string> = {
  [VerificationStatus.VERIFIED]: 'Verified',
  [VerificationStatus.REQUESTED]: 'Requested',
  [VerificationStatus.IN_REVIEW]: 'In review',
  [VerificationStatus.BACKLOGGED]: 'Backlogged',
  [VerificationStatus.NOT_VERIFIED]: 'Not verified',
  [VerificationStatus.NOT_REQUESTED]: 'Not requested'
};

export const getTooltipText = (status: VerificationStatus) => {
  return statusRecordText[status] || statusRecordText[VerificationStatus.NOT_REQUESTED];
};

export const getShareStatus = ({ is_shared }: { is_shared: BusterMetricListItem['is_shared'] }) => {
  if (is_shared) return 'Shared';
  return 'Private';
};
