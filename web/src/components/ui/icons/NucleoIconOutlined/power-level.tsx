import React from 'react';

import type { iconProps } from './iconProps';

function powerLevel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px power level';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.954 4.883L7.215 1.973"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.309,14.952c-.25-.934,.076-6.49,.076-6.49,0,0,3.055,4.652,3.305,5.586s-.305,1.893-1.239,2.143-1.893-.305-2.143-1.239Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.75c2.087,0,3.828,1.513,4.184,3.5h3.029c-.371-3.656-3.459-6.5-7.213-6.5-3.754,0-6.841,2.844-7.213,6.5h3.029c.355-1.987,2.096-3.5,4.184-3.5Z"
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

export default powerLevel;
