import React from 'react';

import type { iconProps } from './iconProps';

function cameraOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px camera off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.285,14.25h6.965c1.105,0,2-.895,2-2V5.75c0-.138-.014-.273-.041-.403"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,3.75h-2.25l-.507-1.351c-.146-.39-.519-.649-.936-.649h-3.114c-.417,0-.79,.259-.936,.649l-.507,1.351H3.75c-1.105,0-2,.895-2,2v6.5c0,1.105,.895,2,2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.055,10.945c-.498-.498-.805-1.185-.805-1.945,0-1.519,1.231-2.75,2.75-2.75,.759,0,1.447,.308,1.945,.805"
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
        <circle cx="4.25" cy="6.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default cameraOff;
