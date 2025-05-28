import React from 'react';

import type { iconProps } from './iconProps';

function mirrorObjY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mirror obj y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25 9L1.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,6.25v-1.5c0-1.105,.895-2,2-2H13.25c1.105,0,2,.895,2,2v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,11.75v1.5c0,1.105,.895,2,2,2H13.25c1.105,0,2-.895,2-2v-1.5"
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

export default mirrorObjY;
