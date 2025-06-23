export enum ShareRole {
  OWNER = 'owner', //owner of the asset
  FULL_ACCESS = 'fullAccess', //same as owner, can share with others
  CAN_EDIT = 'canEdit', //can edit, cannot share
  CAN_FILTER = 'canFilter', //can filter dashboard
  CAN_VIEW = 'canView' //can view asset
}

export enum ShareAssetType {
  METRIC = 'metric',
  DASHBOARD = 'dashboard',
  COLLECTION = 'collection',
  CHAT = 'chat'
}

export interface BusterShare {
  individual_permissions: null | BusterShareIndividual[];
  public_expiry_date: string | null;
  public_enabled_by: string | null;
  publicly_accessible: boolean;
  public_password: string | null;
  permission: ShareRole; //this is the permission the user has to the metric, dashboard or collection
}

export interface BusterShareIndividual {
  email: string;
  role: ShareRole;
  name?: string;
}
