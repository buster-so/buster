import { BusterThreadListItem, BusterVerificationStatus } from '@/api/buster-rest';
import { IBusterThread } from './interfaces';
import { ShareRole } from '@/api/buster-socket/threads';

export const defaultIBusterThread: IBusterThread = {
  created_at: '',
  created_by: '',
  dashboard_id: null,
  deleted_at: null,
  folder_id: null,
  id: 'DEFAULT_ID',
  messages: [],
  updated_at: null,
  updated_by: '',
  title: '',
  isNewThread: false,
  isFollowupMessage: false,
  isInitialLoad: true,
  dashboards: [],
  password_secret_id: null,
  public_expiry_date: null,
  public_enabled_by: null,
  publicly_accessible: false,
  state_message_id: null,
  collections: [],
  dataset_id: null,
  dataset_name: null,
  sharingKey: '',
  individual_permissions: null,
  team_permissions: null,
  organization_permissions: null,
  public_password: null,
  permission: ShareRole.VIEWER
};

export const defaultBusterThreadListItem: BusterThreadListItem = {
  id: 'DEFAULT_ID',
  last_edited: '',
  title: '',
  dataset_name: '',
  dataset_uuid: '',
  created_by_id: '',
  created_by_name: '',
  created_by_email: '',
  created_by_avatar: '',
  status: BusterVerificationStatus.notRequested,
  is_shared: false
};
