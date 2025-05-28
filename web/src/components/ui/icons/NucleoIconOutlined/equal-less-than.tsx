import React from 'react';

import type { iconProps } from './iconProps';

function equalLessThan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px equal less than';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 15.75L14.25 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14 2.25L4 7.5 14 12.75"
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

export default equalLessThan;
