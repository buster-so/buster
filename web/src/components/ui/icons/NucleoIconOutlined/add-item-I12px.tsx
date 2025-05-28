import React from 'react';

import type { iconProps } from './iconProps';

function addItem(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px add item';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.75 0.75L8.75 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 3.25L6.25 3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.751,1.25h-1.501c-1.105,0-2,.895-2,2v5.5c0,1.105.895,2,2,2h5.5c1.105,0,2-.895,2-2v-1.501"
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

export default addItem;
