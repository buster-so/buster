import { BusterOrganization } from '@/api/buster_rest';

export enum OrganizationResponses {
  '/organizations/post:post' = '/organizations/post:post'
}

export type OrganizationResponsesPost_postOrganization = {
  route: '/organizations/post:post';
  callback: (d: BusterOrganization) => void;
  onError?: (d: unknown) => void;
};

export type OrganizationResponsesTypes = OrganizationResponsesPost_postOrganization;
