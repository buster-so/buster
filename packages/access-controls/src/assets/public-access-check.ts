export function hasPublicAccess(
  publiclyAccessible: boolean,
  publicExpiryDate?: string,
  publicPassword?: string,
  password?: string
): boolean {
  if (!publiclyAccessible) {
    return false;
  }
  const today = new Date();
  if (publicExpiryDate && new Date(publicExpiryDate) < today) {
    return false;
  }
  if (publicPassword && publicPassword !== password) {
    return false;
  }
  return true;
}
