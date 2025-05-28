import React from 'react';

import type { iconProps } from './iconProps';

function messageForward(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message forward';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.5,7.75H2.75c-.552,0-1,.448-1,1v2.5c0,1.105,.895,2,2,2h2v3l3.75-3h4.75c1.105,0,2-.895,2-2V4.25c0-1.105-.895-2-2-2H3.75c-1.105,0-2,.895-2,2v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8 5L10.75 7.75 8 10.5"
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

export default messageForward;
