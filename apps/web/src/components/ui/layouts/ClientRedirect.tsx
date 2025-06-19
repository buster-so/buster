'use client';

import { useEffect } from 'react';

export const ClientRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    //keep window, do not use router
    window.location.href = to;
  }, [to]);

  return null;
};
