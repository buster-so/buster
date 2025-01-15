import { BusterThreadMessageConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import { BusterSocketRequestBase } from '../baseInterfaces';
import { ShareRequest } from '../dashboards';
import { BusterVerificationStatus } from '@/api/buster-rest';

export type ThreadListEmitPayload = BusterSocketRequestBase<
  '/threads/list',
  {
    page_token: number;
    page_size: number;
    admin_view: boolean;
    filters?: { status: BusterVerificationStatus[] | null };
  }
>;

export type ThreadUnsubscribeEmitPayload = BusterSocketRequestBase<
  '/threads/unsubscribe',
  { id: null | string }
>;

export type ThreadSubscribeToThread = BusterSocketRequestBase<
  '/threads/get',
  { id: string; password?: string }
>;

export type ThreadCreateNewThread = BusterSocketRequestBase<
  '/threads/post',
  {
    dataset_id: string | null;
    thread_id: string | null;
    suggestion_id?: string | null;
    prompt?: string;
    message_id?: string; //only send if we want to REPLACE current message
    draft_session_id?: string;
  }
>;

export enum ShareRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export type ThreadUpdateThread = BusterSocketRequestBase<
  '/threads/update',
  {
    id: string; //thread id
    save_to_dashboard?: string;
    remove_from_dashboard?: string; // dashboard_id optional
    add_to_collections?: string[]; // collection_id
    remove_from_collections?: string[]; // collection_id
    save_draft?: boolean;
    save_as_thread_state?: string; //message id to make primary
  } & ShareRequest
>;

export type ThreadUpdateMessage = BusterSocketRequestBase<
  '/threads/messages/update',
  {
    id: string; //messageid id
    chart_config?: BusterThreadMessageConfig;
    title?: string;
    sql?: string;
    feedback?: 'negative';
    status?: BusterVerificationStatus;
  }
>;

export type ThreadDelete = BusterSocketRequestBase<'/threads/delete', { ids: string[] }>;

export type ThreadGetDataByMessageId = BusterSocketRequestBase<
  '/threads/messages/data',
  { id: string }
>;

export type ThreadSearch = BusterSocketRequestBase<
  '/threads/search',
  {
    prompt: string;
  }
>;

export type ThreadDuplicate = BusterSocketRequestBase<
  '/threads/duplicate',
  {
    id: string;
    message_id: string;
    share_with_same_people: boolean;
  }
>;

export type ThreadEmits =
  | ThreadDuplicate
  | ThreadListEmitPayload
  | ThreadUnsubscribeEmitPayload
  | ThreadUpdateThread
  | ThreadCreateNewThread
  | ThreadSubscribeToThread
  | ThreadDelete
  | ThreadUpdateMessage
  | ThreadGetDataByMessageId
  | ThreadSearch;
