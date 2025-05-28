import React from 'react';

import type { iconProps } from './iconProps';

function histogramAxisX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px histogram axis x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,10.75c-4.722,0-3.271-7-7.25-7s-2.528,7-7.25,7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 14.25L1.75 14.25"
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

export default histogramAxisX;
