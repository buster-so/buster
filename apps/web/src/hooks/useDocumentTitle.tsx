import { useEffect } from 'react';

export const useDocumentTitle = (title: string | undefined) => {
  useEffect(() => {
    if (!title) return;
    setTimeout(() => {
      document.title = title;
    }, 25);
  }, [title]);
};

export const updateDocumentTitle = (callback: (currentTitle: string) => string) => {
  const currentTitle = document.title;
  const newTitle = callback(currentTitle);
  document.title = newTitle;
};
