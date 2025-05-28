import React from 'react';

import type { iconProps } from './iconProps';

function circleOpenDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle open down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25 11.25L6.75 11.25 6.75 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,11.25L14.127,3.873"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.127,3.873c-2.831-2.831-7.422-2.831-10.253,0-2.831,2.831-2.831,7.422,0,10.253,2.831,2.831,7.422,2.831,10.253,0,2.075-2.075,2.629-5.094,1.663-7.674"
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

export default circleOpenDownLeft;
