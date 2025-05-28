import React from 'react';

import type { iconProps } from './iconProps';

function creditCardSignal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card signal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75 7.25L16.25 7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 11.25L7.25 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,7.25v-1.5c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v6.5c0,1.104,.895,2,2,2h4.676"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,16.25v-.25c0-3.452,2.798-6.25,6.25-6.25h.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,16.25v-.25c0-1.792,1.458-3.25,3.25-3.25h.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M17,17c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default creditCardSignal;
