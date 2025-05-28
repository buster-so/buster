import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldRightToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold right to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.543,13.426l5.555-4.021c.276-.2,.276-.61,0-.81L7.543,4.574c-.331-.239-.793-.003-.793,.405v2.271H2.75c-.552,0-1,.448-1,1v1.5c0,.552,.448,1,1,1H6.75v2.271c0,.408,.463,.644,.793,.405Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 14.25L16.25 3.75"
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

export default arrowBoldRightToLine;
