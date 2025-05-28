import React from 'react';

import type { iconProps } from './iconProps';

function escalatorUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px escalator up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6.5"
          cy="2.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.75,11.75v-3.25c0-.966.784-1.75,1.75-1.75h0c.966,0,1.75.784,1.75,1.75v.45"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.8564,16.25h-1.3564c-1.243,0-2.25-1.007-2.25-2.25h0c0-1.243,1.007-2.25,2.25-2.25h1.75l7.2123-6.7311c.1852-.1728.429-.2689.6823-.2689h1.3564c1.243,0,2.25,1.007,2.25,2.25h0c0,1.243-1.007,2.25-2.25,2.25h-1.75l-7.2123,6.7311c-.1852.1728-.429.2689-.6823.2689Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.74 12.75L16.25 12.75 16.25 16.26"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 12.75L12.75 16.25"
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

export default escalatorUp;
