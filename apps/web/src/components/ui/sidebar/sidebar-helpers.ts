import Cookies from 'js-cookie';
import { getCookie } from '@/api/server-functions/getCookie';

export const COLLAPSIBLE_COOKIE_NAME = (id: string) => `collapsible-${id}`;

export const setCollapsibleCookie = (id: string, value: boolean) => {
  Cookies.set(COLLAPSIBLE_COOKIE_NAME(id), value.toString(), {
    expires: 365,
  });
};

export const getCollapsibleCookie = (id: string) => {
  return getCookie({ data: COLLAPSIBLE_COOKIE_NAME(id) });
};
