import React from 'react';

import type { iconProps } from './iconProps';

function globeLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px globe lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.652,8.505c-.571-1.421-3.555-2.505-7.152-2.505-4.004,0-7.25,1.343-7.25,3,0,1.657,3.246,3,7.25,3,.585,0,1.154-.029,1.699-.083"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,13.75v-1.5c0-.828,.672-1.5,1.5-1.5h0c.828,0,1.5,.672,1.5,1.5v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.496,9.361c.002-.12,.004-.24,.004-.361,0-4.004-1.343-7.25-3-7.25-1.657,0-3,3.246-3,7.25s1.343,7.25,3,7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.5,16.25c-4.004,0-7.25-3.246-7.25-7.25S4.496,1.75,8.5,1.75c3.849,0,6.997,2.999,7.236,6.788"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3.5"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.25"
          y="13.75"
        />
      </g>
    </svg>
  );
}

export default globeLock;
