import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldUpToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold up to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.426,10.457l-4.021-5.555c-.2-.276-.61-.276-.81,0l-4.021,5.555c-.239,.331-.003,.793,.405,.793h2.271v4c0,.552,.448,1,1,1h1.5c.552,0,1-.448,1-1v-4h2.271c.408,0,.644-.463,.405-.793Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 1.75L3.75 1.75"
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

export default arrowBoldUpToLine;
