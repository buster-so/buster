import { BusterSocketRequestBase } from '../baseInterfaces';

export type TermsListRequest = BusterSocketRequestBase<
  '/terms/list',
  {
    page: number;
    page_size: number;
  }
>;

export type TermsGetRequest = BusterSocketRequestBase<
  '/terms/get',
  {
    id: string;
  }
>;

export type TermPostRequest = BusterSocketRequestBase<
  '/terms/post',
  {
    name: string;
    definition: string;
    sql_snippet?: string;
    dataset_ids: string[];
  }
>;

export type TermUpdateRequest = BusterSocketRequestBase<
  '/terms/update',
  {
    id: string;
    name?: string;
    definition?: string;
    sql_snippet?: string;
    add_to_dataset?: string[];
    remove_from_dataset?: string[];
  }
>;

export type TermDeleteRequest = BusterSocketRequestBase<
  '/terms/delete',
  {
    ids: string[];
  }
>;

export type TermsEmits =
  | TermsListRequest
  | TermsGetRequest
  | TermPostRequest
  | TermUpdateRequest
  | TermDeleteRequest;
