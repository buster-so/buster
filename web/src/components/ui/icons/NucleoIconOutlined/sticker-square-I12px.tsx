import React from 'react';

import type { iconProps } from './iconProps';

function stickerSquare(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sticker square';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m4.25,10.75c.828,0,1.5-.672,1.5-1.5v-1.5c0-1.105.895-2,2-2h1.5c.828,0,1.5-.672,1.5-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.343,10.75h-2.093c-1.105,0-2-.895-2-2V3.25c0-1.105.895-2,2-2h5.5c1.105,0,2,.895,2,2v2.093c0,1.061-.421,2.078-1.172,2.828l-1.407,1.407c-.75.75-1.768,1.172-2.828,1.172Z"
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
