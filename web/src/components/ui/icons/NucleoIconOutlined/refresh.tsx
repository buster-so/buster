import React from 'react';

import type { iconProps } from './iconProps';

function refresh(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px refresh';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25 9.5L3 7.25 0.75 9.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.762,13.048c-1.146,1.347-2.855,2.202-4.762,2.202-3.452,0-6.25-2.798-6.25-6.25,0-.597,.084-1.175,.24-1.722"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 8.5L15 10.75 17.25 8.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.238,4.952c1.146-1.347,2.855-2.202,4.762-2.202,3.452,0,6.25,2.798,6.25,6.25,0,.579-.079,1.14-.226,1.672"
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

export default refresh;
