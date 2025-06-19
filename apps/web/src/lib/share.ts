import { ShareRole } from '@/api/asset_interfaces';

export const getIsOwner = (role: ShareRole | null | undefined) => {
  return role === ShareRole.OWNER;
};

export const getIsEffectiveOwner = (role: ShareRole | null | undefined) => {
  return role === ShareRole.FULL_ACCESS || role === ShareRole.OWNER;
};

export const canEdit = (role: ShareRole | null | undefined) => {
  return role === ShareRole.CAN_EDIT || role === ShareRole.FULL_ACCESS || role === ShareRole.OWNER;
};

export const canShare = (role: ShareRole | null | undefined) => {
  return role === ShareRole.FULL_ACCESS || role === ShareRole.OWNER;
};

export const canFilter = (role: ShareRole | null | undefined) => {
  return (
    role === ShareRole.CAN_FILTER ||
    role === ShareRole.FULL_ACCESS ||
    role === ShareRole.OWNER ||
    role === ShareRole.CAN_EDIT
  );
};
