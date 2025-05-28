import { mainApi } from '../instances';
import type { BusterTerm, BusterTermListItem } from '@/api/asset_interfaces/terms';

export const getTermsList = async (params: {
  /** The page number to retrieve */
  page_token: number;
  /** The number of items per page */
  page_size: number;
}) => {
  return mainApi.get<BusterTermListItem[]>('/terms', { params }).then((res) => res.data);
};

export const getTerm = async (id: string) => {
  return mainApi.get<BusterTerm>(`/terms/${id}`).then((res) => res.data);
};

export const createTerm = async (params: {
  /** The name of the term */
  name: string;
  /** The definition or description of the term */
  definition: string;
  /** Optional SQL snippet associated with the term */
  sql_snippet?: string;
  /** Array of dataset IDs where this term should be applied */
  dataset_ids: string[];
}) => {
  return mainApi.post<BusterTerm>('/terms', params).then((res) => res.data);
};

export const updateTerm = async (params: {
  /** The unique identifier of the term to update */
  id: string;
  /** Optional new name for the term */
  name?: string;
  /** Optional new definition for the term */
  definition?: string;
  /** Optional new SQL snippet for the term */
  sql_snippet?: string;
  /** Optional array of dataset IDs to add this term to */
  add_to_dataset?: string[];
  /** Optional array of dataset IDs to remove this term from */
  remove_from_dataset?: string[];
}) => {
  return mainApi.put<BusterTerm>(`/terms/${params.id}`, params).then((res) => res.data);
};

export const deleteTerms = async (data: { ids: string[] }) => {
  return mainApi.delete<BusterTerm>('/terms', { data }).then((res) => res.data);
};
