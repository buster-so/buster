import React from 'react';

import type { iconProps } from './iconProps';

function shuffle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shuffle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.5 16L16.25 13.25 13.5 10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.147,11l1.253,1.521c.38,.461,.946,.729,1.544,.729h4.056"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,4.75h1.306c.598,0,1.164,.267,1.544,.729l1.253,1.521"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5 2L16.25 4.75 13.5 7.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,13.25h1.306c.598,0,1.164-.267,1.544-.729l5.8-7.043c.38-.461,.946-.729,1.544-.729h4.056"
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

export default shuffle;
