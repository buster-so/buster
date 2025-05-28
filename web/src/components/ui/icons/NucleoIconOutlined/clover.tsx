import React from 'react';

import type { iconProps } from './iconProps';

function clover(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clover';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,9c-2.009-2.412-3.19-4.254-3.19-5.902,0-.622,.3-1.222,.976-1.329,.805-.128,1.66,.421,2.214,1.081,.555-.66,1.409-1.208,2.214-1.081,.676,.107,.976,.707,.976,1.329,0,1.649-1.181,3.491-3.19,5.902"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,9c2.009,2.412,3.19,4.254,3.19,5.902,0,.622-.3,1.222-.976,1.329-.805,.128-1.66-.421-2.214-1.081-.555,.66-1.409,1.208-2.214,1.081-.676-.107-.976-.707-.976-1.329,0-1.649,1.181-3.491,3.19-5.902"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,9c2.412-2.009,4.254-3.19,5.902-3.19,.622,0,1.222,.3,1.329,.976,.128,.805-.421,1.66-1.081,2.214,.66,.555,1.208,1.409,1.081,2.214-.107,.676-.707,.976-1.329,.976-1.649,0-3.491-1.181-5.902-3.19"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,9c-2.412,2.009-4.254,3.19-5.902,3.19-.622,0-1.222-.3-1.329-.976-.128-.805,.421-1.66,1.081-2.214-.66-.555-1.208-1.409-1.081-2.214,.107-.676,.707-.976,1.329-.976,1.649,0,3.491,1.181,5.902,3.19"
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

export default clover;
