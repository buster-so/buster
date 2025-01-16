'use client';

import React, { useMemo } from 'react';

export const useIsShowingEllipsis = (
  textRef: React.RefObject<HTMLDivElement>,
  text: string,
  maxLength = 25,
  width?: number
): boolean => {
  const isShowingEllipsis = useMemo(() => {
    if (textRef.current) {
      return textRef.current?.scrollWidth > textRef.current?.clientWidth;
    }
    if (!text) return false;
    return text.length > maxLength;
  }, [text, textRef.current, width, maxLength]);
  return isShowingEllipsis;
};
