import React from 'react';

import type { iconProps } from './iconProps';

function externalLink(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px external link';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75 7.5L7.75 4.25 4.5 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.5 4.5L0.75 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.785,10.25h2.965c1.105,0,2-.895,2-2V2.75c0-1.105-.895-2-2-2H3.75c-1.105,0-2,.895-2,2v3.465"
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
