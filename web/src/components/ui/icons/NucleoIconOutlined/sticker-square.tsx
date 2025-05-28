import React from 'react';

import type { iconProps } from './iconProps';

function stickerSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sticker square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.25,15.25c.828,0,1.5-.672,1.5-1.5v-3c0-1.105,.895-2,2-2h3c.828,0,1.5-.672,1.5-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.515,15.25h-2.765c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2H13.25c1.105,0,2,.895,2,2v2.765c0,1.591-.632,3.117-1.757,4.243l-1.735,1.735c-1.125,1.125-2.651,1.757-4.243,1.757Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default stickerSquare;
