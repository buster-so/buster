import type { VerificationStatus } from '../share';

export type BusterMetricListItem = {
  id: string;
  name: string;
  last_edited: string;
  dataset_name: string;
  dataset_uuid: string;
  created_by_id: string;
  created_by_name: string;
  created_by_email: string;
  created_by_avatar: string;
  status: VerificationStatus;
  is_shared: boolean;
};
