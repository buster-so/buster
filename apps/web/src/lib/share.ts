import type { ShareRole } from '@buster/server-shared/share';

export const getIsOwner = (role: ShareRole | null | undefined) => {
  return role === 'owner';
};

export const getIsEffectiveOwner = (role: ShareRole | null | undefined) => {
  return role === 'full_access' || role === 'owner';
};

export const canEdit = (role: ShareRole | null | undefined) => {
  return role === 'can_edit' || role === 'full_access' || role === 'owner';
};

export const canShare = (role: ShareRole | null | undefined) => {
  return role === 'full_access' || role === 'owner';
};

export const canFilter = (role: ShareRole | null | undefined) => {
  return role === 'full_access' || role === 'owner' || role === 'can_edit';
};
