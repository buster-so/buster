import React from 'react';

import type { iconProps } from './iconProps';

function userFeather(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user feather';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.763,10.401c-.833-.413-1.769-.651-2.763-.651-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,1.089,.344,2.507,.643,4.152,.708"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,17.25s.682-5.991,6.5-6.5c-1.43,1.69,0,5-3.75,5"
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

export default userFeather;
