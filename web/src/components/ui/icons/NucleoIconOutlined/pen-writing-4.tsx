import React from 'react';

import type { iconProps } from './iconProps';

function penWriting4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen writing 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.25,10.25h-1c-.828,0-1.5,.672-1.5,1.5h0c0,.828,.672,1.5,1.5,1.5H14.75c.828,0,1.5,.672,1.5,1.5h0c0,.828-.672,1.5-1.5,1.5h-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.836,10.164s2.034-.034,2.75-.75,5.25-5.25,5.25-5.25c.552-.552,.552-1.448,0-2-.552-.552-1.448-.552-2,0,0,0-4.534,4.534-5.25,5.25s-.75,2.75-.75,2.75Z"
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

export default penWriting4;
