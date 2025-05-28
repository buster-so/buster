import React from 'react';

import type { iconProps } from './iconProps';

function musicNoteSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px music note slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.25,8.75V1.75s1.303,2.048,3.427,3.573"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.406,16.13c.268,.078,.551,.12,.844,.12,1.657,0,3-1.343,3-3,0-.293-.042-.577-.12-.844"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.485,10.515c-.377-.17-.795-.265-1.235-.265-1.657,0-3,1.343-3,3,0,.44,.095,.858,.265,1.235"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default musicNoteSlash;
