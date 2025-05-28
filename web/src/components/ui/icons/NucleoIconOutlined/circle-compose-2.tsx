import React from 'react';

import type { iconProps } from './iconProps';

function circleCompose2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle compose 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.182,8c.045,.327,.068,.661,.068,1,0,4.004-3.246,7.25-7.25,7.25S1.75,13.004,1.75,9,4.996,1.75,9,1.75c.339,0,.673,.023,1,.068"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,11.25s2.12-.12,2.836-.836l6.25-6.25c.552-.552,.552-1.448,0-2-.552-.552-1.448-.552-2,0l-6.25,6.25c-.716,.716-.836,2.836-.836,2.836Z"
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

export default circleCompose2;
