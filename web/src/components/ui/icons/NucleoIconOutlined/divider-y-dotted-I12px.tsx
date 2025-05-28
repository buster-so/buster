import React from 'react';

import type { iconProps } from './iconProps';

function dividerYDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px divider y dotted';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.75,1.25c0,1.105-.895,2-2,2H3.25c-1.105,0-2-.895-2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.75,10.75c0-1.105-.895-2-2-2H3.25c-1.105,0-2,.895-2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="10.25" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="7.417" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="4.583" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.75" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default dividerYDotted;
