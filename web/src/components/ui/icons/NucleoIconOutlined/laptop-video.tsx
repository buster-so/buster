import React from 'react';

import type { iconProps } from './iconProps';

function laptopVideo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px laptop video';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M17.619,1.288c-.234-.133-.525-.129-.754,.011l-2.122,1.272c-.15,.09-.243,.253-.243,.429v1c0,.176,.092,.339,.243,.429l2.121,1.271c.119,.072,.253,.108,.387,.108,.127,0,.254-.032,.368-.097,.235-.133,.381-.383,.381-.653V1.941c0-.271-.146-.521-.381-.653Z"
          fill="currentColor"
        />
        <path
          d="M0.75 14.75L17.25 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,2.75h-2c-1.105,0-2,.895-2,2V12.75c0,1.105,.895,2,2,2H13.75c1.105,0,2-.895,2-2V7.736"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5.5"
          width="6"
          fill="none"
          rx="1.75"
          ry="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="8.75"
          y=".75"
        />
      </g>
    </svg>
  );
}

export default laptopVideo;
