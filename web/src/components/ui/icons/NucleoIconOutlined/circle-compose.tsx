import React from 'react';

import type { iconProps } from './iconProps';

function circleCompose(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle compose';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.971,7c.182,.635,.279,1.306,.279,2,0,4.004-3.246,7.25-7.25,7.25S1.75,13.004,1.75,9,4.996,1.75,9,1.75c.694,0,1.365,.097,2,.279"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16 2L7.75 10.25"
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

export default circleCompose;
