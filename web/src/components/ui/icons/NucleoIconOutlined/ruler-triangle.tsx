import React from 'react';

import type { iconProps } from './iconProps';

function rulerTriangle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ruler triangle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.586,15.25H3.75c-.552,0-1-.448-1-1V3.414c0-.891,1.077-1.337,1.707-.707L15.293,13.543c.63,.63,.184,1.707-.707,1.707Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6,11.5v-1.925c0-.445,.539-.669,.854-.354l1.926,1.925c.315,.315,.092,.854-.354,.854h-1.926c-.276,0-.5-.224-.5-.5Z"
          fill="currentColor"
        />
        <path
          d="M6.25 15.25L6.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 15.25L8.75 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 15.25L11.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 6.75L4.25 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 9.25L4.25 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 11.75L4.25 11.75"
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

export default rulerTriangle;
