import React from 'react';

import type { iconProps } from './iconProps';

function flame2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flame 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11,14.1667c0-2.0508-2-4.1667-2-4.1667,0,0-2,2.1159-2,4.1667,0,1.1506.8954,2.0833,2,2.0833s2-.9327,2-2.0833Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.3415,10.4885c0-.9292.7073-5.0251.7073-5.0251l1.5915.8841,3.3598-4.5976s5.6585,4.5976,5.6585,8.7385c0,3.6732-2.9002,5.7615-5.6585,5.7615s-5.6585-2.0883-5.6585-5.7615Z"
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

export default flame2;
