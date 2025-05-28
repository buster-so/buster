import React from 'react';

import type { iconProps } from './iconProps';

function externalLink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px external link';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.25,9.25V3.75c0-1.105,.895-2,2-2h6c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2H7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.24 6.75L11.25 6.75 11.25 10.76"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 6.75L1.75 16.25"
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

export default externalLink;
