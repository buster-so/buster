import React from 'react';

import type { iconProps } from './iconProps';

function target(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px target';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 9L12.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 5.75L12.25 3.5 14.75 1 14.75 3.25 17 3.25 14.5 5.75 12.25 5.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.36,1.882c-.441-.084-.895-.132-1.36-.132C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25,7.25-3.246,7.25-7.25c0-.465-.048-.919-.132-1.36"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.649,4.815c-.213-.033-.427-.065-.649-.065-2.347,0-4.25,1.903-4.25,4.25s1.903,4.25,4.25,4.25,4.25-1.903,4.25-4.25c0-.222-.033-.436-.065-.649"
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

export default target;
