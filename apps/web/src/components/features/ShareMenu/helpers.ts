import type {
  BusterCollection,
  BusterDashboardResponse,
  BusterShare,
  IBusterMetric
} from '@/api/asset_interfaces';

export const getShareAssetConfig = (
  message: IBusterMetric | BusterDashboardResponse | BusterCollection | null
): BusterShare | null => {
  if (!message) return null;

  const {
    permission,
    individual_permissions,
    public_expiry_date,
    public_enabled_by,
    publicly_accessible,
    public_password
  } = message;

  return {
    permission,
    individual_permissions,
    public_expiry_date,
    public_enabled_by,
    publicly_accessible,
    public_password
  };
};
