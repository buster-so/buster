import React from 'react';

import type { iconProps } from './iconProps';

function shareUpRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px share up right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.268 6.732L11.073 0.927"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 4.5L11.25 0.75 7.5 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.25,6.285v2.465c0,1.105-.895,2-2,2H3.25c-1.105,0-2-.895-2-2v-4c0-1.105.895-2,2-2h2.465"
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

export default shareUpRight2;
