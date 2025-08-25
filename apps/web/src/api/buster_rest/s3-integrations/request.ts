import type {
  CreateS3IntegrationRequest,
  GetS3IntegrationResponse,
  CreateS3IntegrationResponse,
  DeleteS3IntegrationResponse
} from '@buster/server-shared/s3-integrations';
import { mainApiV2 } from '../instances';

// Using mainApiV2 for v2 endpoints

// GET /api/v2/s3-integrations
export const getS3Integration = async (): Promise<GetS3IntegrationResponse> => {
  const response = await mainApiV2.get('/s3-integrations');
  return response.data;
};

// POST /api/v2/s3-integrations
export const createS3Integration = async (
  data: CreateS3IntegrationRequest
): Promise<CreateS3IntegrationResponse> => {
  const response = await mainApiV2.post('/s3-integrations', data);
  return response.data;
};

// DELETE /api/v2/s3-integrations/:id
export const deleteS3Integration = async (id: string): Promise<DeleteS3IntegrationResponse> => {
  const response = await mainApiV2.delete(`/s3-integrations/${id}`);
  return response.data;
};
