import React from 'react';

import type { iconProps } from './iconProps';

function focusModeOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px focus mode off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.873,14.127c-1.312-1.312-2.123-3.124-2.123-5.127,0-2.934,1.743-5.461,4.25-6.602"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.127,3.873c-.611-.611-1.33-1.113-2.126-1.476"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,15.602c2.507-1.141,4.25-3.668,4.25-6.602,0-1.088-.24-2.12-.669-3.046"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.702,11.298c-.588-.588-.952-1.401-.952-2.298,0-1.795,1.455-3.25,3.25-3.25,.897,0,1.71,.364,2.298,.952"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.236,9.299c-.142,1.556-1.381,2.796-2.938,2.938"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default focusModeOff;
