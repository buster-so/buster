import React from 'react';

import type { iconProps } from './iconProps';

function gif(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gif';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.75 4.75L9.75 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 13.25L12.75 4.75 17.241 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 8.75L16.75 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.5,9.25h2.75c-.099,2.231-1.235,4-3.25,4-1.985,0-3.25-1.903-3.25-4.25s1.265-4.25,3.25-4.25c1.286,0,2.27,.799,2.803,2"
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

export default gif;
