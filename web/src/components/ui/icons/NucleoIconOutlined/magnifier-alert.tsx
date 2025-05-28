import React from 'react';

import type { iconProps } from './iconProps';

function magnifierAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px magnifier alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.001,11.384c-.882,1.42-2.456,2.366-4.251,2.366-2.761,0-5-2.239-5-5S3.989,3.75,6.75,3.75c.084,0,.167,.002,.25,.006"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 16.25L10.285 12.285"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.5,8.25h.433c.788,0,1.267-.869,.845-1.535l-2.933-4.631c-.393-.62-1.297-.62-1.69,0l-2.933,4.631c-.422,.666,.057,1.535,.845,1.535h.433"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12 4.75L12 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12" cy="9.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default magnifierAlert;
