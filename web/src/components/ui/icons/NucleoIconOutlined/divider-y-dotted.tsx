import React from 'react';

import type { iconProps } from './iconProps';

function dividerYDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px divider y dotted';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.75,2.25v1.5c0,1.105.895,2,2,2h8.5c1.105,0,2-.895,2-2v-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,15.75v-1.5c0-1.105.895-2,2-2h8.5c1.105,0,2,.895,2,2v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="2.75" cy="9" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="5.875" cy="9" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="12.125" cy="9" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="15.25" cy="9" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default dividerYDotted;
