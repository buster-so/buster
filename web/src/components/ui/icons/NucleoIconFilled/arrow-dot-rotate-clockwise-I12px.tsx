import React from 'react';

import type { iconProps } from './iconProps';

function arrowDotRotateClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow dot rotate clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.898,15.438c-.296,.041-.598,.062-.898,.062-3.584,0-6.5-2.916-6.5-6.5S5.416,2.5,9,2.5c2.154,0,4.128,1.074,5.329,2.801l-1.458-.202c-.412-.053-.789,.23-.846,.641s.23,.789,.641,.846l2.944,.407c.035,.004,.069,.007,.104,.007,.369,0,.69-.272,.742-.647l.408-2.945c.057-.411-.229-.789-.64-.846-.415-.06-.789,.23-.846,.64l-.116,.84c-1.496-1.886-3.781-3.042-6.261-3.042C4.589,1,1,4.589,1,9s3.589,8,8,8c.368,0,.739-.025,1.102-.075,.411-.057,.697-.435,.641-.845-.057-.411-.437-.692-.845-.641Z"
          fill="currentColor"
        />
        <circle cx="14.25" cy="13.75" fill="currentColor" r="2.75" />
      </g>
    </svg>
  );
}

export default arrowDotRotateClockwise;
