import React from 'react';

import type { iconProps } from './iconProps';

function heartHalf(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart half';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,4.47c.71-1.061,1.896-1.704,3.173-1.72,2.123,.013,3.834,1.739,3.827,3.859,0,4.826-4.959,7.794-6.529,8.613-.149,.078-.31,.116-.471,.116"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.47c-.71-1.061-1.896-1.704-3.173-1.72-2.123,.013-3.834,1.739-3.827,3.859,0,4.826,4.959,7.794,6.529,8.613,.149,.078,.31,.116,.471,.116V4.47Z"
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

export default heartHalf;
