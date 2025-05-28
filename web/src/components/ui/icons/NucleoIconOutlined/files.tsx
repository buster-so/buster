import React from 'react';

import type { iconProps } from './iconProps';

function files(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px files';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25,13.25h-1c-1.105,0-2-.895-2-2V3.25c0-1.105,.895-2,2-2h5c1.105,0,2,.895,2,2v1.052"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,14.25V6.25c0-1.105,.895-2,2-2h4.086c.265,0,.52,.105,.707,.293l2.914,2.914c.188,.188,.293,.442,.293,.707v6.086c0,1.105-.895,2-2,2H7.25c-1.105,0-2-.895-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,8.25h-3c-.552,0-1-.448-1-1v-3"
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

export default files;
