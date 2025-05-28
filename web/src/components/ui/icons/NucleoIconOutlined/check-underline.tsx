import React from 'react';

import type { iconProps } from './iconProps';

function checkUnderline(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px check underline';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4 8L7 11.75 13.981 2.742"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 15.25L15.25 15.25"
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

export default checkUnderline;
