import React from 'react';

import type { iconProps } from './iconProps';

function ironDoNot(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px iron do not';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,12.25H1.75s.587-5.58,.787-7.479c.117-1.111,1.121-1.91,2.23-1.776,1.609,.195,3.218,.39,4.827,.585"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.469,8.066c.72,.547,1.318,1.259,1.735,2.093l1.046,2.091h-6.965"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5,6.25l5.519,.631c.175,.02,.347,.047,.518,.082"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.812 14.75L16.25 14.75"
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
        <circle cx="6.75" cy="9.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default ironDoNot;
