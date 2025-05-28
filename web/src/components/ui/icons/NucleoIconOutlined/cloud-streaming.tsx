import React from 'react';

import type { iconProps } from './iconProps';

function cloudStreaming(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud streaming';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.704,6.042l-2.308-1.346c-.397-.232-.896,.055-.896,.515v2.693c0,.46,.499,.747,.896,.515l2.308-1.346c.394-.23,.394-.8,0-1.03Z"
          fill="currentColor"
        />
        <path
          d="M11.25 14.25L16.25 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 14.25L8.75 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,5.25c-.196,0-.385,.028-.568,.071-.327-2.022-2.067-3.571-4.182-3.571s-3.855,1.549-4.182,3.571c-.183-.043-.372-.071-.568-.071-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5H13.75c1.381,0,2.5-1.119,2.5-2.5s-1.119-2.5-2.5-2.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 16L8.75 12.5"
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

export default cloudStreaming;
