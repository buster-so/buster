import nextApi from '@/api/next/instances';

export interface AppSupportRequest {
  userName: string;
  userEmail: string;
  userId: string;
  message?: string;
  subject?: string;
  type: 'feedback' | 'help';
  organizationId: string;
}

export const submitAppSupportRequest = async (data: AppSupportRequest) => {
  return await nextApi.post('/api/support', data).then((res) => res.data);
};
