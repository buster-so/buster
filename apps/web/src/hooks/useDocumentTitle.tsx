'use client';

import { useEffect } from 'react';

export const useDocumentTitle = (title: string | undefined) => {
  useEffect(() => {
    if (!title) return;
    setTimeout(() => {
      document.title = title;
    }, 25);
  }, [title]);
};
