import React from 'react';

import type { iconProps } from './iconProps';

function pins(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pins';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.25,7.425c0,2.382-3.114,6.208-4.545,7.84-.375,.427-1.034,.427-1.409,0-1.431-1.633-4.545-5.458-4.545-7.84,0-3.171,2.713-5.011,5.25-5.011s5.25,1.84,5.25,5.011Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.228,2.886c1.679,.736,3.022,2.308,3.022,4.539,0,2.382-3.114,6.208-4.545,7.84-.187,.214-.446,.321-.705,.321"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="7"
          cy="7.75"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default pins;
