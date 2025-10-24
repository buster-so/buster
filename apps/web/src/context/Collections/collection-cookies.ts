import Cookies from 'js-cookie';

export const COLLECTION_LAYOUT_COOKIE_NAME = (collectionId: string) =>
  `collection-layout-${collectionId}`;

export const setCollectionLayoutCookie = (collectionId: string, layout: 'grid' | 'list') => {
  Cookies.set(COLLECTION_LAYOUT_COOKIE_NAME(collectionId), JSON.stringify({ value: layout }), {
    expires: 180, // 180 days
  });
};
