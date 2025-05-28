import React from 'react';

import type { iconProps } from './iconProps';

function focusMode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px focus mode';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6,15.602c-2.507-1.141-4.25-3.668-4.25-6.602S3.493,3.539,6,2.398"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,15.602c2.507-1.141,4.25-3.668,4.25-6.602,0-2.934-1.743-5.461-4.25-6.602"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default focusMode;
