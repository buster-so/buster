import React from 'react';

import type { iconProps } from './iconProps';

function arrowRotateAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow rotate anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3,13.071c1.304,1.919,3.505,3.179,6,3.179,4.004,0,7.25-3.246,7.25-7.25S13.004,1.75,9,1.75c-3.031,0-5.627,1.86-6.71,4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.88 3.305L2.288 6.25 5.232 5.843"
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

export default arrowRotateAnticlockwise;
