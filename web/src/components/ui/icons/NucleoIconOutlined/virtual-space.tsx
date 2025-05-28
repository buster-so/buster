import React from 'react';

import type { iconProps } from './iconProps';

function virtualSpace(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px virtual space';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.253,10.989c-.978-.153-2.083-.239-3.253-.239-1.17,0-2.274,.086-3.253,.239"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,5c0-1.243-3.246-2.25-7.25-2.25C4.996,2.75,1.75,3.757,1.75,5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 5L1.75 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 5L16.25 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,5c0,.88,1.628,1.642,4,2.012l-.002,8c-2.371-.37-3.998-1.132-3.998-2.012"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,13c0,.88-1.627,1.642-3.998,2.012l-.002-8c2.372-.37,4-1.132,4-2.012"
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

export default virtualSpace;
