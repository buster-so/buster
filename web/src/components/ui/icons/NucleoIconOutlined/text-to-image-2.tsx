import React from 'react';

import type { iconProps } from './iconProps';

function textToImage2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text to image 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.5,6.5v-1.75c0-1.381-1.119-2.5-2.5-2.5h-.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14 5.25L12.5 7 11 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.17,5.973c.642,.333,1.08,1.004,1.08,1.777v6.5c0,1.105-.895,2-2,2h-6.5c-1.105,0-2-.895-2-2V7.75c0-1.105,.895-2,2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M10,10c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z" fill="currentColor" />
        <path
          d="M8.101,16.142l5.105-5.099c.391-.391,1.024-.391,1.414,0l2.63,2.63"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 1.25L3.25 7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 1.25L0.75 1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.743,13.769l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356Z"
          fill="currentColor"
        />
        <circle cx="1.75" cy="10.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default textToImage2;
