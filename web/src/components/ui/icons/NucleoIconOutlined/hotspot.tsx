import React from 'react';

import type { iconProps } from './iconProps';

function hotspot(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hotspot';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.157,15.149c-2.046-1.282-3.407-3.556-3.407-6.149C1.75,4.996,4.996,1.75,9,1.75s7.25,3.246,7.25,7.25c0,2.593-1.361,4.867-3.407,6.149"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.747,12.604c-1.2-.751-1.997-2.085-1.997-3.604,0-2.347,1.903-4.25,4.25-4.25s4.25,1.903,4.25,4.25c0,1.52-.798,2.853-1.997,3.604"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default hotspot;
