import React from 'react';

import type { iconProps } from './iconProps';

function angle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px angle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,8.25c3.866,0,7,3.134,7,7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,2.75V13.25c0,1.105,.895,2,2,2H15.25"
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

export default angle;
