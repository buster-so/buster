import React from 'react';

import type { iconProps } from './iconProps';

function penArrowClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen arrow clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.2067,11.4009c.1432-.0495.2733-.1309.3805-.238l3.3031-3.3031c.4832-.4833.4778-1.2613-.0054-1.7446h0c-.4833-.4833-1.2613-.4887-1.7446-.0055l-3.3031,3.3031c-.1071.1071-.1885.2372-.238.3805l-.8491,2.4567,2.4567-.8491Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.9561,1.8255c3.9623-.5765,7.6418,2.1683,8.2183,6.1306s-2.1683,7.6418-6.1306,8.2183c-3.9623.5765-7.6418-2.1683-8.2183-6.1306-.4131-2.8393.8793-5.5329,3.1023-7.0439"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.2558 2.7703L5.2289 2.75 5.25 5.7219"
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

export default penArrowClockwise;
