import React from 'react';

import type { iconProps } from './iconProps';

function pilcrow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pilcrow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.25 1.75L8.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 1.75L12.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,1.75H7.5c-2.071,0-3.75,1.679-3.75,3.75h0c0,2.071,1.679,3.75,3.75,3.75h.75"
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

export default pilcrow;
