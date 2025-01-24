import { BusterSocketRequestBase } from '../baseInterfaces';

export type OrganizationPostRequest = BusterSocketRequestBase<
  '/organizations/post',
  {
    name: string;
  }
>;

export type OrganizationsEmits = OrganizationPostRequest;
