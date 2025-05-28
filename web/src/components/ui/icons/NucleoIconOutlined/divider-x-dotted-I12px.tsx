import React from 'react';

import type { iconProps } from './iconProps';

function dividerXDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px divider x dotted';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.25,1.25c1.105,0,2,.895,2,2v5.5c0,1.105-.895,2-2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.75,1.25c-1.105,0-2,.895-2,2v5.5c0,1.105.895,2,2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="1.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="4.583" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="7.417" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="10.25" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default dividerXDotted;
