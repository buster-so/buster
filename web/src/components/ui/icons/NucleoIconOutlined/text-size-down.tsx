import React from 'react';

import type { iconProps } from './iconProps';

function textSizeDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text size down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.1789,8.3244c.3715-.4093.9005-.5744,1.438-.5744h0c.9013,0,1.6314.7482,1.6314,1.6701v2.8299"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m14.249,10.0978c0,1.188-.9418,2.1522-2.1023,2.1522h-.1234c-.5651,0-1.0233-.469-1.0233-1.0476h0c0-.5037.3501-.936.8336-1.0294l1.7409-.313c.4117-.0795.6803-.4814.6125-.897"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.2 12.25L6.469 5.75 6.334 5.75 3.603 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.233 10.75L8.57 10.75"
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

export default textSizeDown;
