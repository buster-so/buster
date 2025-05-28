import React from 'react';

import type { iconProps } from './iconProps';

function smokingBan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px smoking ban';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,14.25h-1c-.552,0-1-.448-1-1v-1.5c0-.552,.448-1,1-1H7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.785,10.75h4.465c.552,0,1,.448,1,1v1.5c0,.552-.448,1-1,1H7.285"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 10.75L12.25 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,2.25v.25c0,1.519,1.231,2.75,2.75,2.75h0c.759,0,1.447,.308,1.945,.805"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.484,6.055c.173,.534,.266,1.103,.266,1.695v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,2.25h0c1.519,0,2.894,.616,3.889,1.611"
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
      </g>
    </svg>
  );
}

export default smokingBan;
