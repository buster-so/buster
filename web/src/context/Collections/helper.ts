import type { BusterCollection } from '@/api/buster_rest/collection';

export const canEditCollection = (collection: BusterCollection) => {
  return collection.permission === 'owner' || collection.permission === 'editor';
};
