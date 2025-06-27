'use client';

import { useEffect } from 'react';

export const useDocumentTitle = (title: string | undefined) => {
  useEffect(() => {
    if (!title) return;
    document.title = title;
  }, [title]);
};
