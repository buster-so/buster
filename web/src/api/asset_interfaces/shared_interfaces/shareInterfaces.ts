import type { ShareRole } from '../share/shareInterfaces';

/**
 * Type defining the sharing permissions and settings for a dashboard
 *
 * @interface ShareRequest
 */
export type SharePostRequest = {
  email: string;
  role: ShareRole;
}[];

export type ShareDeleteRequest = string[];

export type ShareUpdateRequest = {
  users?: {
    email: string;
    role: ShareRole;
  }[];
  publicly_accessible?: boolean;
  public_password?: string | null;
  public_expiry_date?: string | null;
};
