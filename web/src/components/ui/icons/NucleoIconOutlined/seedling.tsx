import React from 'react';

import type { iconProps } from './iconProps';

function seedling(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px seedling';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m9,8.25h-1.25c-2.761,0-5-2.239-5-5h0v-.5h2.25c2.209,0,4,1.791,4,4v1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 15.25L9 10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.999,9.935c1.8984-.7091,3.251-2.5397,3.251-4.685h0v-.5h-2.25c-2.209,0-4,1.791-4,4v1.5"
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

export default seedling;
