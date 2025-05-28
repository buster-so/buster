import React from 'react';

import type { iconProps } from './iconProps';

function bathrobe(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bathrobe';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12,1.75c-.153,.761-.526,2.094-1.531,3.438-.771,1.031-1.626,1.682-2.219,2.062v9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6,1.75c.153,.761,.526,2.094,1.531,3.437,.485,.648,1.003,1.147,1.469,1.522"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 10.25L13.25 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 5.75L13.25 16.25 4.75 16.25 4.75 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.375,10.25l.875-.25-.621-5.592c-.08-.716-.538-1.334-1.2-1.617l-2.429-1.041h-3s-3,0-3,0l-2.429,1.041c-.662,.284-1.12,.902-1.2,1.617l-.621,5.592,.875,.25"
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

export default bathrobe;
