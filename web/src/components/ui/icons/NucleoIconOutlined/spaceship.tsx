import React from 'react';

import type { iconProps } from './iconProps';

function spaceship(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px spaceship';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.071,10.556l-1.233,.746c-.664,.401-1.036,1.149-.956,1.92l.368,3.528,3.151-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.929,10.556l1.233,.746c.664,.401,1.036,1.149,.956,1.92l-.368,3.528-3.151-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,14.75h2.599c.371-.672,2.328-4.368,.866-8.651-.892-2.612-2.625-4.183-3.465-4.849-.839,.666-2.573,2.237-3.465,4.849-1.462,4.283,.495,7.979,.866,8.651,0,0,2.599,0,2.599,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 16.75L9 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="7.75" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default spaceship;
