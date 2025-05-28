import type { BusterUserTeam } from '@/api/asset_interfaces/users';
import { mainApi } from '../instances';

export const createTeam = async (params: {
  /** The name of the team */
  name: string;
  /** Optional description of the team */
  description?: string;
}) => {
  return mainApi.post<{ id: string }>('/teams', params).then((res) => res.data);
};

export const getTeamsList = async (params: {
  page_size?: number;
  page?: number;
  permission_group_id?: string | null;
  user_id?: string | null;
  belongs_to?: boolean | null;
}) => {
  return mainApi.get<BusterUserTeam[]>('/teams', { params }).then((res) => res.data);
};
