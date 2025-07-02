import { mainApiV2 } from '../instances';

export interface AppSupportRequest {
  userName: string;
  userEmail: string;
  userId: string;
  message?: string;
  subject?: string;
  type: 'feedback' | 'help';
  organizationId: string;
  organizationName: string;
  currentURL: string;
  currentTimestamp: string;
  screenshot: string; //base64 encoded image
}

export const submitAppSupportRequest = async (data: AppSupportRequest) => {
  return await mainApiV2.post<{ success: boolean }>('/support', data).then((res) => res.data);
};
