import React from 'react';

import type { iconProps } from './iconProps';

function creativeCommons(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px creative commons';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8,11.016c-.301,.15-.641,.234-1,.234-1.243,0-2.25-1.007-2.25-2.25s1.007-2.25,2.25-2.25c.359,0,.699,.084,1,.234"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13,11.016c-.301,.15-.641,.234-1,.234-1.243,0-2.25-1.007-2.25-2.25s1.007-2.25,2.25-2.25c.359,0,.699,.084,1,.234"
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

export default creativeCommons;
