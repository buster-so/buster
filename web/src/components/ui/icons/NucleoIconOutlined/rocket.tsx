import React from 'react';

import type { iconProps } from './iconProps';

function rocket(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rocket';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.035,10.418c3.655-3.835,3.208-8.305,3.17-8.623-.319-.038-4.788-.485-8.623,3.17-2.323,2.214-3.105,4.686-3.332,5.513l3.272,3.272c.827-.227,3.299-1.009,5.513-3.332Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.104,15.218c-.275,.608-.888,1.032-1.599,1.032H1.75v-1.754c0-.711,.423-1.324,1.032-1.599"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.972,10.484l.246,1.377c.224,1.253-.296,2.523-1.334,3.258l-2.654,1.881s.643-1.681,.279-4.005"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.516,5.028l-1.374-.246c-1.255-.225-2.527,.296-3.264,1.337l-1.878,2.651s1.681-.643,4.005-.279"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="11.25" cy="6.75" fill="currentColor" r="1.75" />
      </g>
    </svg>
  );
}

export default rocket;
