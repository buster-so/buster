import React from 'react';

import type { iconProps } from './iconProps';

function folderContent2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder content 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.966,2.75h7.784c1.105,0,2,.895,2,2v3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.124,5.75h4.626c1.105,0,2,.895,2,2v5c0,1.105-.895,2-2,2H4.25c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h1.716c.649,0,1.258,.315,1.632,.845l1.526,2.155Z"
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

export default folderContent2;
