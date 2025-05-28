import React from 'react';

import type { iconProps } from './iconProps';

function carVentilation(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px car ventilation';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.187,7.75c-.882,1.047-1.215,1.992-.998,2.833,.321,1.248,1.675,1.583,1.997,2.833,.217,.842-.116,1.786-.998,2.833"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.619,12.851c.53,.114,1.072,.241,1.631,.399V3.75c-2.882-.811-5.411-1-7.25-1-2.994,0-5.479,.502-7.25,1V13.25c.681-.191,1.469-.383,2.349-.547"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.812,7.75c-.882,1.047-1.215,1.992-.998,2.833,.321,1.248,1.675,1.583,1.997,2.833,.217,.842-.116,1.786-.998,2.833"
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

export default carVentilation;
