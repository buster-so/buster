import React from 'react';

import type { iconProps } from './iconProps';

function upload2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px upload 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6 2L6 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,1.75C1.645,1.75.75,2.645.75,3.75v4.5c0,1.105.895,2,2,2h6.5c1.105,0,2-.895,2-2V3.75c0-1.105-.895-2-2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 4L6 1.75 3.75 4"
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

export default upload2;
