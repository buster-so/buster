import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldLeftToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold left to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.457,4.574l-5.555,4.021c-.276,.2-.276,.61,0,.81l5.555,4.021c.331,.239,.793,.003,.793-.405v-2.271h4c.552,0,1-.448,1-1v-1.5c0-.552-.448-1-1-1h-4v-2.271c0-.408-.463-.644-.793-.405Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 3.75L1.75 14.25"
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

export default arrowBoldLeftToLine;
