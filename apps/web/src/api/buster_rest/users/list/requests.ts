import type {
  GetUserToOrganizationRequest,
  GetUserToOrganizationResponse,
} from '@buster/server-shared/user';
import { mainApiV2 } from '../../instances';

export const getUserToOrganization = async (params: GetUserToOrganizationRequest) => {
  return mainApiV2
    .get<GetUserToOrganizationResponse>('/users', { params })
    .then((response) => response.data);
};
