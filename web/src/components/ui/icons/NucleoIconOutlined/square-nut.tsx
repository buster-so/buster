import React from 'react';

import type { iconProps } from './iconProps';

function squareNut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square nut';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <path
          d="M12.25,10.309v-2.618c0-.357-.19-.686-.498-.865l-2.25-1.305c-.31-.18-.693-.18-1.003,0l-2.25,1.305c-.308,.179-.498,.508-.498,.865v2.618c0,.357,.19,.686,.498,.865l2.25,1.305c.31,.18,.693,.18,1.003,0l2.25-1.305c.308-.179,.498-.508,.498-.865Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default squareNut;
