import React from 'react';

import type { iconProps } from './iconProps';

function plane2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px plane 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.485 4.9777L2.5 4 1.5 5.25 7.747 8.0264"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.0223 7.515L14 15.5 12.75 16.5 9.9736 10.253"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.4283,2.5716h0c-.7966-.7966-2.0985-.7616-2.8512.0765l-6.8271,7.6019h-2.5l-2,2.5h4v4l2.5-2v-2.5l7.6018-6.8271c.8382-.7527.8731-2.0546.0765-2.8512Z"
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

export default plane2;
