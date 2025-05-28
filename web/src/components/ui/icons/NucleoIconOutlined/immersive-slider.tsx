import React from 'react';

import type { iconProps } from './iconProps';

function immersiveSlider(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px immersive slider';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m12.75,4.75h-7.5l-3.126-1.7863c-.1667-.0952-.374.0251-.374.2171v11.1384c0,.192.2074.3123.374.2171l3.126-1.7863h7.5l3.126,1.7863c.1667.0952.374-.0251.374-.2171V3.1808c0-.192-.2074-.3123-.374-.2171l-3.126,1.7863Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 4.75L5.25 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 4.75L12.75 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 15.75L12.25 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.75" cy="15.75" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default immersiveSlider;
