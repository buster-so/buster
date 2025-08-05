import type { MetricListItem } from '@buster/server-shared/metrics';
import type { VerificationStatus } from '@buster/server-shared/share';

const statusRecordText: Record<VerificationStatus, string> = {
  verified: 'Verified',
  requested: 'Requested',
  inReview: 'In review',
  backlogged: 'Backlogged',
  notVerified: 'Not verified',
  notRequested: 'Not requested'
};

export const getTooltipText = (status: VerificationStatus) => {
  return statusRecordText[status] || statusRecordText['notRequested'];
};

export const getShareStatus = ({ is_shared }: { is_shared: MetricListItem['is_shared'] }) => {
  if (is_shared) return 'Shared';
  return 'Private';
};
