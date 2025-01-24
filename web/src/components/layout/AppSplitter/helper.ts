export const createAutoSaveId = (id: string) => `app-splitter-${id}`;

import Cookies from 'js-cookie';

export const setAppSplitterCookie = (key: string, value: any) => {
  Cookies.set(key, JSON.stringify(value), {
    expires: 365,
    secure: true,
    sameSite: 'strict'
  });
};
