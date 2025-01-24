import { BusterSocketRequestBase } from '../baseInterfaces';

export type TeamRequestsList = BusterSocketRequestBase<
  '/teams/list',
  {
    page_size?: number;
    page?: number;
    permission_group_id?: null | string;
    user_id?: null | string;
    belongs_to?: boolean | null;
  }
>;

export type TeamEmits = TeamRequestsList;
