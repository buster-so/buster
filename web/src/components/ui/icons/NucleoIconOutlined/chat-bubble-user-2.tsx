import React from 'react';

import type { iconProps } from './iconProps';

function chatBubbleUser2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble user 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="4.551"
          cy="8.75"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M.75,16c.525-1.597,2.028-2.75,3.801-2.75s3.276,1.153,3.801,2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,.75h-5c-.828,0-1.5,.672-1.5,1.5v6.5s2.75-2.5,2.75-2.5h3.75c.828,0,1.5-.672,1.5-1.5V2.25c0-.828-.672-1.5-1.5-1.5Z"
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

export default chatBubbleUser2;
