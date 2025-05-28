import React from 'react';

import type { iconProps } from './iconProps';

function workflow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px workflow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.25,4.75c1.1046,0,2,.8954,2,2v4.5c0,1.1046.8954,2,2,2h3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5 10.5L16.25 13.25 13.5 16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.75"
          cy="4.75"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default workflow;
