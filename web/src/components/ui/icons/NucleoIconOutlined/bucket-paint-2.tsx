import React from 'react';

import type { iconProps } from './iconProps';

function bucketPaint2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bucket paint 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,4.5l1.25,9.45c0,.994,2.239,1.8,5,1.8s5-.806,5-1.8l1.25-9.45"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,4.5c0-1.243-2.798-2.25-6.25-2.25S2.75,3.257,2.75,4.5c0,1.099,2.19,2.012,5.084,2.208,.518,.035,.916,.475,.916,.994v2.297c0,.69,.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-2.561c0-.47,.328-.883,.789-.975,1.915-.384,3.211-1.119,3.211-1.964Z"
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

export default bucketPaint2;
