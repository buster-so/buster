import React from 'react';

import type { iconProps } from './iconProps';

function inputPassword(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px input password';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75,13.25H3.75c-1.105,0-2-.895-2-2V6.75c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,12.25v-2c0-.828,.672-1.5,1.5-1.5h0c.828,0,1.5,.672,1.5,1.5v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.5" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
        <rect
          height="4"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="10.75"
          y="12.25"
        />
      </g>
    </svg>
  );
}

export default inputPassword;
