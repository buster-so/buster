import React from 'react';

import type { iconProps } from './iconProps';

function forklift(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px forklift';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25,13.5v-4.464c0-.19-.027-.378-.08-.56l-1.46-5.006c-.124-.427-.516-.72-.96-.72h-3c-.552,0-1,.448-1,1v5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.231 13.25L7.75 13.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.176,8.75H2.75c-1.105,0-2,.895-2,2v2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25,15.25h-2.5c-.552,0-1-.448-1-1V1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="2.5"
          cy="13.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9.5"
          cy="13.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default forklift;
